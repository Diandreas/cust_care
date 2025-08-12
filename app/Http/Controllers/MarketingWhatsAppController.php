<?php

namespace App\Http\Controllers;

use App\Models\MarketingClient;
use App\Models\MarketingMessage;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MarketingWhatsAppController extends Controller
{
    protected $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Afficher les conversations WhatsApp
     */
    public function conversations(Request $request)
    {
        $query = MarketingMessage::where('user_id', auth()->id())
            ->where('type', 'whatsapp')
            ->with(['client', 'campaign'])
            ->orderBy('created_at', 'desc');

        // Filtres
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('client')) {
            $query->where('client_id', $request->client);
        }

        if ($request->filled('campaign')) {
            $query->where('campaign_id', $request->client);
        }

        $conversations = $query->paginate(20)
            ->withQueryString();

        // Grouper par client pour les conversations
        $groupedConversations = $conversations->groupBy('client_id');

        return Inertia::render('Marketing/WhatsApp/Conversations', [
            'conversations' => $conversations,
            'groupedConversations' => $groupedConversations,
            'filters' => $request->only(['status', 'client', 'campaign'])
        ]);
    }

    /**
     * Afficher une conversation spécifique
     */
    public function showConversation($conversationId)
    {
        $client = MarketingClient::where('user_id', auth()->id())
            ->findOrFail($conversationId);

        $messages = MarketingMessage::where('user_id', auth()->id())
            ->where('client_id', $client->id)
            ->where('type', 'whatsapp')
            ->orderBy('created_at', 'asc')
            ->get();

        return Inertia::render('Marketing/WhatsApp/Conversation', [
            'client' => $client,
            'messages' => $messages
        ]);
    }

    /**
     * Répondre à une conversation
     */
    public function reply(Request $request, $conversationId)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:1000',
            'use_ai' => 'boolean',
            'quick_reply' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $client = MarketingClient::where('user_id', auth()->id())
                ->findOrFail($conversationId);

            $message = $request->message;
            
            // Utiliser une réponse rapide si fournie
            if ($request->filled('quick_reply')) {
                $message = $this->getQuickReply($request->quick_reply, $client);
            }

            // Envoyer le message
            $result = $this->whatsappService->sendMessage(
                $client,
                $message,
                [
                    'use_ai' => $request->use_ai ?? false,
                    'user_id' => auth()->id(),
                    'reply_to' => $conversationId,
                ]
            );

            return back()->with('success', 'Message envoyé avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de la réponse: ' . $e->getMessage());
            return back()->withErrors(['reply' => 'Erreur lors de l\'envoi: ' . $e->getMessage()]);
        }
    }

    /**
     * Obtenir les statistiques WhatsApp
     */
    public function stats(Request $request)
    {
        try {
            $period = $request->get('period', '30'); // 7, 30, 90 jours
            
            $stats = $this->whatsappService->getStats(auth()->id(), [
                'period' => $period,
                'include_details' => true,
            ]);

            // Statistiques supplémentaires
            $additionalStats = [
                'total_clients' => MarketingClient::where('user_id', auth()->id())
                    ->where('status', 'active')
                    ->count(),
                'active_conversations' => MarketingMessage::where('user_id', auth()->id())
                    ->where('type', 'whatsapp')
                    ->where('created_at', '>=', now()->subDays(7))
                    ->distinct('client_id')
                    ->count('client_id'),
                'response_rate' => $this->calculateResponseRate(),
                'average_response_time' => $this->calculateAverageResponseTime(),
            ];

            $stats = array_merge($stats, $additionalStats);

            return Inertia::render('Marketing/WhatsApp/Stats', [
                'stats' => $stats,
                'period' => $period
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des stats WhatsApp: ' . $e->getMessage());
            return back()->withErrors(['stats' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()]);
        }
    }

    /**
     * Tester la connexion WhatsApp
     */
    public function testConnection()
    {
        try {
            $result = $this->whatsappService->testConnection();

            return response()->json([
                'success' => true,
                'message' => 'Connexion WhatsApp réussie',
                'details' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur de connexion WhatsApp: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erreur de connexion: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Envoyer un message de test
     */
    public function sendTestMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone' => 'required|string|max:20',
            'message' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Créer un client temporaire pour le test
            $testClient = new MarketingClient([
                'phone' => $request->phone,
                'name' => 'Test Client',
                'status' => 'active',
            ]);

            $result = $this->whatsappService->sendMessage(
                $testClient,
                $request->message,
                [
                    'user_id' => auth()->id(),
                    'test_message' => true,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Message de test envoyé avec succès',
                'details' => $result
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi du message de test: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les réponses rapides
     */
    public function getQuickReplies()
    {
        $quickReplies = [
            'greeting' => [
                'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
                'Salut ! Comment allez-vous ?',
                'Bonjour ! Ravi de vous rencontrer !'
            ],
            'support' => [
                'Je suis là pour vous aider. Que puis-je faire pour vous ?',
                'N\'hésitez pas à me poser vos questions !',
                'Comment puis-je vous assister ?'
            ],
            'closing' => [
                'Merci de votre confiance !',
                'N\'hésitez pas à revenir vers nous si besoin.',
                'À bientôt !'
            ],
            'promotion' => [
                'Profitez de nos offres spéciales !',
                'Découvrez nos nouveautés !',
                'Offre limitée en cours !'
            ]
        ];

        return response()->json([
            'success' => true,
            'quick_replies' => $quickReplies
        ]);
    }

    /**
     * Obtenir l'historique des messages d'un client
     */
    public function getClientHistory($clientId)
    {
        try {
            $client = MarketingClient::where('user_id', auth()->id())
                ->findOrFail($clientId);

            $messages = MarketingMessage::where('user_id', auth()->id())
                ->where('client_id', $clientId)
                ->where('type', 'whatsapp')
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'client' => $client,
                'messages' => $messages
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de l\'historique: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Marquer un message comme lu
     */
    public function markAsRead($messageId)
    {
        try {
            $message = MarketingMessage::where('user_id', auth()->id())
                ->findOrFail($messageId);

            $message->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Message marqué comme lu'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du marquage comme lu: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors du marquage: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les clients avec des conversations récentes
     */
    public function getRecentClients()
    {
        try {
            $recentClients = MarketingClient::where('user_id', auth()->id())
                ->where('status', 'active')
                ->whereHas('messages', function ($query) {
                    $query->where('type', 'whatsapp')
                          ->where('created_at', '>=', now()->subDays(7));
                })
                ->with(['messages' => function ($query) {
                    $query->where('type', 'whatsapp')
                          ->latest()
                          ->take(1);
                }])
                ->take(10)
                ->get();

            return response()->json([
                'success' => true,
                'recent_clients' => $recentClients
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des clients récents: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir une réponse rapide personnalisée
     */
    private function getQuickReply($type, $client)
    {
        $replies = [
            'greeting' => "Bonjour {$client->name} ! Comment puis-je vous aider aujourd'hui ?",
            'support' => "Je suis là pour vous aider {$client->name}. Que puis-je faire pour vous ?",
            'closing' => "Merci de votre confiance {$client->name} ! N'hésitez pas à revenir vers nous si besoin.",
            'promotion' => "Bonjour {$client->name} ! Profitez de nos offres spéciales !",
        ];

        return $replies[$type] ?? $replies['greeting'];
    }

    /**
     * Calculer le taux de réponse
     */
    private function calculateResponseRate()
    {
        $totalMessages = MarketingMessage::where('user_id', auth()->id())
            ->where('type', 'whatsapp')
            ->where('created_at', '>=', now()->subDays(30))
            ->count();

        if ($totalMessages === 0) return 0;

        $responses = MarketingMessage::where('user_id', auth()->id())
            ->where('type', 'whatsapp')
            ->where('created_at', '>=', now()->subDays(30))
            ->where('status', 'read')
            ->count();

        return round(($responses / $totalMessages) * 100, 1);
    }

    /**
     * Calculer le temps de réponse moyen
     */
    private function calculateAverageResponseTime()
    {
        $messages = MarketingMessage::where('user_id', auth()->id())
            ->where('type', 'whatsapp')
            ->where('created_at', '>=', now()->subDays(30))
            ->whereNotNull('read_at')
            ->get();

        if ($messages->isEmpty()) return 0;

        $totalTime = 0;
        $count = 0;

        foreach ($messages as $message) {
            if ($message->sent_at && $message->read_at) {
                $totalTime += $message->sent_at->diffInMinutes($message->read_at);
                $count++;
            }
        }

        return $count > 0 ? round($totalTime / $count, 1) : 0;
    }

    /**
     * Obtenir les webhooks WhatsApp
     */
    public function webhooks(Request $request)
    {
        try {
            // Traiter les webhooks WhatsApp
            if ($request->has('Body')) {
                // Message entrant
                $this->whatsappService->processIncomingMessage($request->all());
            } elseif ($request->has('MessageStatus')) {
                // Statut de message
                $this->whatsappService->processStatusWebhook($request->all());
            }

            return response('OK', 200);

        } catch (\Exception $e) {
            Log::error('Erreur lors du traitement du webhook: ' . $e->getMessage());
            return response('Error', 500);
        }
    }

    /**
     * Configurer les webhooks WhatsApp
     */
    public function configureWebhooks(Request $request)
    {
        try {
            $webhookUrl = route('marketing.whatsapp.webhooks');
            
            // Ici vous pouvez configurer les webhooks avec votre fournisseur WhatsApp
            // Par exemple, avec Twilio
            
            return response()->json([
                'success' => true,
                'message' => 'Webhooks configurés avec succès',
                'webhook_url' => $webhookUrl
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la configuration des webhooks: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la configuration: ' . $e->getMessage()
            ], 500);
        }
    }
}