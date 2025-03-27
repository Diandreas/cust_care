<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Http\Controllers\PaymentController;
use App\Models\PendingTransaction;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotchPayController extends Controller
{
    /**
     * Initialiser un paiement d'abonnement via NotchPay
     */
    public function initializeSubscriptionPayment(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => 'required|integer|exists:subscription_plans,id',
            'duration' => 'required|string|in:monthly,annual',
        ]);
        
        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);
        $user = Auth::user();
        
        // Calculer le prix
        $price = $validated['duration'] === 'annual' ? $plan->annual_price : $plan->price;
        
        // Initialiser le paiement NotchPay
        $fields = [
            'email' => $user->email,
            'amount' => (string)$price,
            'currency' => 'XAF',
            'description' => 'Abonnement ' . $plan->name . ' (' . $validated['duration'] . ')',
            'reference' => 'sub_' . uniqid(),
            'callback' => route('subscription.notchpay.callback'),
            'sandbox' => config('services.notchpay.sandbox', true)
        ];
        
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.notchpay.secret_key'),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(15)
              ->retry(3, 500)
              ->post('https://api.notchpay.co/payments/initialize', $fields);
            
            if ($response->failed()) {
                $statusCode = $response->status();
                $responseBody = $response->body();
                
                Log::error("Erreur NotchPay ($statusCode)", [
                    'body' => $responseBody,
                    'fields' => $fields
                ]);
                
                if ($statusCode >= 500) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Le service de paiement est temporairement indisponible. Veuillez réessayer plus tard.',
                        'error_type' => 'service_unavailable'
                    ], 503);
                }
                
                if ($statusCode === 401 || $statusCode === 403) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Erreur d\'authentification avec le service de paiement.',
                        'error_type' => 'authentication_error'
                    ], 500);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'initialisation du paiement: ' . ($response->json('message') ?? 'Erreur inconnue'),
                    'error_type' => 'api_error'
                ], 400);
            }
            
            $responseData = $response->json();
            
            if (!isset($responseData['authorization_url']) || empty($responseData['authorization_url'])) {
                Log::error('Réponse NotchPay invalide', [
                    'response' => $responseData,
                    'fields' => $fields
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Réponse invalide du service de paiement',
                    'error_type' => 'invalid_response'
                ], 500);
            }
            
            $pendingTransaction = PendingTransaction::create([
                'user_id' => $user->id,
                'reference' => $fields['reference'],
                'amount' => $price,
                'type' => 'subscription',
                'status' => 'pending',
                'metadata' => json_encode([
                    'plan_id' => $plan->id,
                    'duration' => $validated['duration'],
                    'payment_method' => 'notchpay',
                    'api_reference' => $responseData['reference'] ?? null
                ])
            ]);
            
            return response()->json([
                'success' => true,
                'authorization_url' => $responseData['authorization_url']
            ]);
            
        } catch (\Exception $e) {
            Log::error('Exception NotchPay', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'fields' => $fields
            ]);
            
            $errorMessage = $e->getMessage();
            $isNetworkError = strpos($errorMessage, 'cURL error 28') !== false ||
                              strpos($errorMessage, 'cURL error 6') !== false ||
                              strpos($errorMessage, 'cURL error 7') !== false;
                              
            if ($isNetworkError) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le service de paiement est temporairement inaccessible. Veuillez réessayer plus tard.',
                    'error_type' => 'network_error',
                    'alternative_methods' => ['paypal', 'momo']
                ], 503);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'initialisation du paiement: ' . $e->getMessage(),
                'error_type' => 'unknown_error'
            ], 500);
        }
    }

    /**
     * Callback pour les paiements d'abonnement NotchPay
     */
    public function handleSubscriptionCallback(Request $request)
    {
        // Vérification du paiement
        try {
            $reference = $request->reference;
            
            if (!$reference) {
                Log::error('Référence manquante dans le callback NotchPay', [
                    'request' => $request->all()
                ]);
                
                return redirect()->route('subscription.plans')
                    ->with('error', 'Paiement non complété: référence manquante');
            }
            
            // Vérifier le statut du paiement auprès de NotchPay
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.notchpay.secret_key'),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->get('https://api.notchpay.co/payments/verify/' . $reference);
            
            if (!$response->successful()) {
                Log::error('Erreur de vérification NotchPay', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                    'reference' => $reference
                ]);
                
                return redirect()->route('subscription.plans')
                    ->with('error', 'Erreur de vérification du paiement');
            }
            
            $responseData = $response->json();
            
            if ($responseData['status'] !== 'success') {
                Log::error('Paiement NotchPay non réussi', [
                    'status' => $responseData['status'],
                    'reference' => $reference
                ]);
                
                return redirect()->route('subscription.plans')
                    ->with('error', 'Paiement non complété');
            }
            
            // Récupérer la transaction en attente
            $pendingTransaction = PendingTransaction::where('reference', $reference)
                ->where('status', 'pending')
                ->first();
            
            if (!$pendingTransaction) {
                Log::error('Transaction en attente non trouvée', [
                    'reference' => $reference
                ]);
                
                return redirect()->route('subscription.plans')
                    ->with('error', 'Transaction non trouvée');
            }
            
            $metadata = json_decode($pendingTransaction->metadata, true);
            $plan = SubscriptionPlan::findOrFail($metadata['plan_id']);
            
            // Marquer la transaction comme complétée
            $pendingTransaction->status = 'completed';
            $pendingTransaction->save();
            
            // Finaliser l'abonnement
            return app(PaymentController::class)->finalizeSubscription(
                $pendingTransaction->user_id,
                $plan,
                $metadata['duration'],
                $pendingTransaction->amount,
                'notchpay'
            );
            
        } catch (\Exception $e) {
            Log::error('Exception dans le callback NotchPay', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->route('subscription.plans')
                ->with('error', 'Erreur lors du traitement du paiement: ' . $e->getMessage());
        }
    }
    
    /**
     * Initialiser un paiement d'addon via NotchPay
     */
    public function initializeAddonPayment(Request $request)
    {
        $validated = $request->validate([
            'addon_type' => 'required|string|in:sms,clients',
            'quantity' => 'required|integer|min:1',
        ]);
        
        $user = Auth::user();
        
        // Calculer le prix
        $price = 0;
        $description = '';
        
        if ($validated['addon_type'] === 'sms') {
            // 100 SMS supplémentaires pour 1000 FCFA
            $price = $validated['quantity'] * 1000;
            $smsAmount = $validated['quantity'] * 100;
            $description = 'Achat de ' . $smsAmount . ' SMS supplémentaires';
        } else if ($validated['addon_type'] === 'clients') {
            // 100 clients supplémentaires pour 2000 FCFA
            $price = $validated['quantity'] * 2000;
            $clientsAmount = $validated['quantity'] * 100;
            $description = 'Augmentation de la limite de ' . $clientsAmount . ' clients';
        }
        
        // Initialiser le paiement NotchPay
        $fields = [
            'email' => $user->email,
            'amount' => (string)$price,
            'currency' => 'XAF',
            'description' => $description,
            'reference' => 'addon_' . uniqid(),
            'callback' => route('addon.notchpay.callback'),
            'sandbox' => config('services.notchpay.sandbox', true)
        ];
        
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.notchpay.secret_key'),
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post('https://api.notchpay.co/payments/initialize', $fields);
            
            if (!$response->successful()) {
                Log::error('Erreur NotchPay', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                    'fields' => $fields
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'initialisation du paiement'
                ], 500);
            }
            
            $responseData = $response->json();
            
            // Sauvegarder les informations de la transaction en attente
            $pendingTransaction = PendingTransaction::create([
                'user_id' => $user->id,
                'reference' => $fields['reference'],
                'amount' => $price,
                'type' => 'addon',
                'status' => 'pending',
                'metadata' => json_encode([
                    'addon_type' => $validated['addon_type'],
                    'quantity' => $validated['quantity'],
                    'payment_method' => 'notchpay'
                ])
            ]);
            
            return response()->json([
                'success' => true,
                'authorization_url' => $responseData['authorization_url']
            ]);
            
        } catch (\Exception $e) {
            Log::error('Exception NotchPay', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'fields' => $fields
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'initialisation du paiement: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Callback pour les paiements d'addon NotchPay
     */
    public function handleAddonCallback(Request $request)
    {
        // Vérification similaire au callback d'abonnement
        // [Implémenter la logique similaire au handleSubscriptionCallback mais pour les addons]
    }
} 