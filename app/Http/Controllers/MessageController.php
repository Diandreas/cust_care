<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Client;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MessageController extends Controller
{
    public function bulkSend(Request $request)
    {
        try {
            $validated = $request->validate([
                'client_ids' => 'required|array',
                'client_ids.*' => 'exists:clients,id',
                'content' => 'required|string|max:800', // 5 SMS max
            ]);
            
            $user = Auth::user();
            $clientIds = $validated['client_ids'];
            $content = $validated['content'];
            
            // Vérifier que les clients appartiennent à l'utilisateur
            $clients = Client::whereIn('id', $clientIds)
                      ->where('user_id', $user->id)
                      ->get();
                      
            if ($clients->count() === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun client valide trouvé.'
                ], 404);
            }
            
            // Vérifier le solde SMS
            $subscription = $this->getUserSubscription($user);
            if ($clients->count() > $subscription['smsBalance']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solde SMS insuffisant. Vous avez besoin de ' . $clients->count() . ' SMS, mais il vous reste ' . $subscription['smsBalance'] . ' SMS.'
                ], 403);
            }
            
            // Envoyer les SMS
            $sent = 0;
            $failed = 0;
            foreach ($clients as $client) {
                try {
                    // Créer le message
                    $message = new Message([
                        'client_id' => $client->id,
                        'user_id' => $user->id,
                        'content' => $content,
                        'status' => 'delivered', // Pour test, normalement 'pending' puis mis à jour par le service SMS
                        'sent_at' => now(),
                    ]);
                    
                    $message->save();
                    $sent++;
                } catch (\Exception $e) {
                    Log::error('Erreur lors de l\'envoi du SMS: ' . $e->getMessage(), [
                        'client_id' => $client->id
                    ]);
                    $failed++;
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => $sent . ' SMS envoyés avec succès. ' . $failed . ' échecs.',
                'sent' => $sent,
                'failed' => $failed
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi en bloc: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Obtenir les informations d'abonnement de l'utilisateur
     */
    private function getUserSubscription($user)
    {
        // Vérifier si l'utilisateur a un abonnement actif
        $activeSubscription = $user->subscription?->isActive() ?? false;
        
        // Compter le nombre de clients
        $clientCount = $user->clients()->count();
        
        // Mode gratuit (sans abonnement actif)
        if (!$activeSubscription) {
            return [
                'plan' => 'Plan Gratuit',
                'clientsLimit' => 50,
                'clientsCount' => $clientCount,
                'smsBalance' => 10 - $user->messages()->whereRaw("strftime('%m', created_at) = ?", [sprintf('%02d', now()->month)])->count(),
                'isFreePlan' => true
            ];
        }
        
        // Si l'utilisateur a un abonnement, retourner les vraies informations
        return [
            'plan' => $user->subscription->plan->name ?? 'Standard',
            'clientsLimit' => $user->subscription->plan->client_limit ?? 100,
            'clientsCount' => $clientCount,
            'smsBalance' => $user->subscription->sms_balance ?? 0,
            'isFreePlan' => false
        ];
    }
    public function index()
    {
        $messages = Auth::user()->messages()
            ->with('client')
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        
        return Inertia::render('Messages/Index', [
            'messages' => $messages
        ]);
    }
    
    public function create()
    {
        $clients = Auth::user()->clients()->get();
        $templates = Auth::user()->templates()->get();
        
        return Inertia::render('Messages/Create', [
            'clients' => $clients,
            'templates' => $templates
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'content' => 'required|string',
        ]);
        
        Message::create([
            'user_id' => Auth::id(),
            'client_id' => $validated['client_id'],
            'content' => $validated['content'],
            'type' => 'personal',
            'status' => 'sent',
            'sent_at' => now(),
        ]);
        
        return redirect()->route('messages.index')->with('success', 'Message envoyé avec succès.');
    }
} 