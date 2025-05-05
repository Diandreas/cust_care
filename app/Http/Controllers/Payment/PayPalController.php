<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Http\Controllers\PaymentController;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PayPalController extends Controller
{
    /**
     * Capturer un paiement d'abonnement PayPal
     */
    public function captureSubscriptionPayment(Request $request)
    {
        $validated = $request->validate([
            'orderID' => 'required|string',
            'plan_id' => 'required|integer|exists:plans,id',
            'duration' => 'required|string|in:monthly,annual',
            'paypalDetails' => 'required|array'
        ]);
        
        $plan = Plan::findOrFail($validated['plan_id']);
        $user = Auth::user();
        
        // Vérifier le paiement PayPal
        try {
            // Vérifier que le paiement est réussi et valide
            $paypalDetails = $validated['paypalDetails'];
            
            if (!isset($paypalDetails['status']) || $paypalDetails['status'] !== 'COMPLETED') {
                Log::error('Paiement PayPal non complété', [
                    'status' => $paypalDetails['status'] ?? 'inconnu',
                    'orderID' => $validated['orderID']
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Le paiement n\'a pas été complété'
                ], 400);
            }
            
            // Vérifier le montant payé
            $expectedAmount = $validated['duration'] === 'annual' ? $plan->annual_price / 655 : $plan->price / 655;
            $paidAmount = 0;
            
            if (isset($paypalDetails['purchase_units']) && count($paypalDetails['purchase_units']) > 0) {
                $purchaseUnit = $paypalDetails['purchase_units'][0];
                if (isset($purchaseUnit['payments']) && isset($purchaseUnit['payments']['captures']) && count($purchaseUnit['payments']['captures']) > 0) {
                    $capture = $purchaseUnit['payments']['captures'][0];
                    $paidAmount = (float) $capture['amount']['value'];
                }
            }
            
            // Tolérance de 0.01 pour les arrondis
            if (abs($paidAmount - $expectedAmount) > 0.01) {
                Log::error('Montant PayPal incorrect', [
                    'expected' => $expectedAmount,
                    'received' => $paidAmount,
                    'orderID' => $validated['orderID']
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Le montant payé ne correspond pas au montant attendu'
                ], 400);
            }
            
            // Calculer le prix en FCFA
            $price = $validated['duration'] === 'annual' ? $plan->annual_price : $plan->price;
            
            // Finaliser l'abonnement
            $result = app(PaymentController::class)->finalizeSubscription(
                $user->id,
                $plan,
                $validated['duration'],
                $price,
                'paypal'
            );
            
            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'Paiement réussi et abonnement activé',
                    'redirect' => route('subscription.dashboard')
                ]);
            } else {
                throw new \Exception('Erreur lors de la finalisation de l\'abonnement');
            }
        } catch (\Exception $e) {
            Log::error('Exception PayPal', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement du paiement: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Capturer un paiement d'addon PayPal
     */
    public function captureAddonPayment(Request $request)
    {
        $validated = $request->validate([
            'orderID' => 'required|string',
            'addon_type' => 'required|string|in:sms,clients',
            'quantity' => 'required|integer|min:1',
            'paypalDetails' => 'required|array'
        ]);
        
        $user = Auth::user();
        
        // Vérifier le paiement PayPal
        try {
            // Vérifier que le paiement est réussi
            $paypalDetails = $validated['paypalDetails'];
            
            if (!isset($paypalDetails['status']) || $paypalDetails['status'] !== 'COMPLETED') {
                Log::error('Paiement PayPal non complété', [
                    'status' => $paypalDetails['status'] ?? 'inconnu',
                    'orderID' => $validated['orderID']
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Le paiement n\'a pas été complété'
                ], 400);
            }
            
            // Calculer le prix
            $price = 0;
            if ($validated['addon_type'] === 'sms') {
                // 100 SMS supplémentaires pour 1000 FCFA
                $price = $validated['quantity'] * 1000;
            } else if ($validated['addon_type'] === 'clients') {
                // 100 clients supplémentaires pour 2000 FCFA
                $price = $validated['quantity'] * 2000;
            }
            
            // Vérifier le montant payé
            $expectedAmount = $price / 655; // Convertir en EUR
            $paidAmount = 0;
            
            if (isset($paypalDetails['purchase_units']) && count($paypalDetails['purchase_units']) > 0) {
                $purchaseUnit = $paypalDetails['purchase_units'][0];
                if (isset($purchaseUnit['payments']) && isset($purchaseUnit['payments']['captures']) && count($purchaseUnit['payments']['captures']) > 0) {
                    $capture = $purchaseUnit['payments']['captures'][0];
                    $paidAmount = (float) $capture['amount']['value'];
                }
            }
            
            // Tolérance de 0.01 pour les arrondis
            if (abs($paidAmount - $expectedAmount) > 0.01) {
                Log::error('Montant PayPal incorrect', [
                    'expected' => $expectedAmount,
                    'received' => $paidAmount,
                    'orderID' => $validated['orderID']
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Le montant payé ne correspond pas au montant attendu'
                ], 400);
            }
            
            // Traiter l'addon
            // [Implémenter la logique pour ajouter l'addon à l'utilisateur]
            // Note: Cette partie devrait être extraite vers une méthode commune dans PaymentController
            
            return response()->json([
                'success' => true,
                'message' => 'Paiement réussi et addon activé',
                'redirect' => route('subscription.dashboard')
            ]);
        } catch (\Exception $e) {
            Log::error('Exception PayPal', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du traitement du paiement: ' . $e->getMessage()
            ], 500);
        }
    }
} 