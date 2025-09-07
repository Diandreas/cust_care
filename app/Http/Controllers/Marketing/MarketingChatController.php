<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Services\AIContentService;
use App\Services\WhatsAppService;
use App\Models\AiConversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Http\JsonResponse;

class MarketingChatController extends Controller
{
    protected $aiService;
    protected $whatsappService;

    public function __construct(AIContentService $aiService, WhatsAppService $whatsappService)
    {
        $this->aiService = $aiService;
        $this->whatsappService = $whatsappService;
    }

    /**
     * Afficher la page de chat IA marketing
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Récupérer l'historique de conversation récent
        $conversationHistory = AiConversation::where('user_id', $user->id)
            ->where('platform', 'web')
            ->latest('last_activity_at')
            ->first();

        $messages = [];
        if ($conversationHistory && $conversationHistory->messages) {
            $messages = array_slice($conversationHistory->messages, -10); // 10 derniers messages
        }

        // Vérifier le statut WhatsApp
        $whatsappConnected = config('services.twilio.whatsapp_number') ? true : false;

        return Inertia::render('Marketing/Chat/Index', [
            'conversation_history' => $messages,
            'whatsapp_connected' => $whatsappConnected,
            'ai_status' => 'online', // Statut de l'IA
            'user_stats' => [
                'total_clients' => $user->clients()->count(),
                'active_campaigns' => $user->campaigns()->where('status', 'active')->count(),
                'messages_today' => $user->messages()->whereDate('created_at', today())->count(),
            ]
        ]);
    }

    /**
     * Envoyer un message au chat IA
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'context' => 'sometimes|array'
        ]);

        $user = Auth::user();
        $message = $request->input('message');
        $context = $request->input('context', []);

        try {
            // Ajouter le contexte utilisateur
            $context = array_merge($context, [
                'platform' => 'web',
                'user_business_type' => $user->business_type ?? null,
                'client_count' => $user->clients()->count(),
                'recent_activity' => $this->getUserRecentActivity($user)
            ]);

            // Générer la réponse IA
            $response = $this->aiService->generateChatResponse($message, $context, $user);

            if (!$response['success']) {
                return response()->json([
                    'success' => false,
                    'error' => 'Erreur lors de la génération de la réponse'
                ], 500);
            }

            return response()->json([
                'success' => true,
                'content' => $response['content'],
                'message_id' => uniqid(),
                'timestamp' => now()->toISOString(),
                'usage' => $response['usage'] ?? null
            ]);

        } catch (\Exception $e) {
            \Log::error('Erreur chat marketing IA', [
                'user_id' => $user->id,
                'message' => $message,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Une erreur inattendue s\'est produite'
            ], 500);
        }
    }

    /**
     * Générer du contenu spécifique
     */
    public function generateContent(Request $request): JsonResponse
    {
        $request->validate([
            'type' => 'required|in:social_post,article,email,flyer_content',
            'topic' => 'required|string|max:200',
            'platform' => 'sometimes|string|in:facebook,instagram,linkedin,twitter',
            'tone' => 'sometimes|string|in:professional,casual,friendly,formal,engaging',
            'parameters' => 'sometimes|array'
        ]);

        $user = Auth::user();
        $type = $request->input('type');
        $topic = $request->input('topic');
        $platform = $request->input('platform', 'facebook');
        $tone = $request->input('tone', 'professional');
        $parameters = $request->input('parameters', []);

        try {
            $result = match($type) {
                'social_post' => $this->aiService->generateSocialPost($topic, $platform, $tone, $parameters, $user),
                'article' => $this->aiService->generateArticle($topic, $parameters['keywords'] ?? '', $parameters['word_count'] ?? 800, $tone, $user),
                'flyer_content' => $this->aiService->generateFlyerContent($parameters['business_type'] ?? 'général', $topic, $parameters, $user),
                default => ['success' => false, 'error' => 'Type de contenu non supporté']
            };

            return response()->json($result);

        } catch (\Exception $e) {
            \Log::error('Erreur génération contenu marketing', [
                'user_id' => $user->id,
                'type' => $type,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération du contenu'
            ], 500);
        }
    }

    /**
     * Analyser les performances marketing
     */
    public function analyzePerformance(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        try {
            // Collecter les données de performance
            $performanceData = [
                'period' => 'last_30_days',
                'clients' => [
                    'total' => $user->clients()->count(),
                    'active' => $user->clients()->where('last_visit', '>=', now()->subDays(30))->count(),
                    'new' => $user->clients()->where('created_at', '>=', now()->subDays(30))->count(),
                ],
                'messages' => [
                    'total_sent' => $user->messages()->where('created_at', '>=', now()->subDays(30))->count(),
                    'delivery_rate' => 95.5, // Mock data
                    'response_rate' => 23.2, // Mock data
                ],
                'campaigns' => [
                    'total' => $user->campaigns()->count(),
                    'active' => $user->campaigns()->where('status', 'active')->count(),
                    'completed' => $user->campaigns()->where('status', 'completed')->where('created_at', '>=', now()->subDays(30))->count(),
                ]
            ];

            // Analyser avec l'IA
            $analysis = $this->aiService->analyzePerformance($performanceData, $user);

            return response()->json($analysis);

        } catch (\Exception $e) {
            \Log::error('Erreur analyse performance marketing', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'analyse des performances'
            ], 500);
        }
    }

    /**
     * Optimiser un contenu existant
     */
    public function optimizeContent(Request $request): JsonResponse
    {
        $request->validate([
            'content' => 'required|string',
            'objective' => 'required|string|max:200',
            'platform' => 'sometimes|string',
            'audience' => 'sometimes|string'
        ]);

        $user = Auth::user();
        
        try {
            $result = $this->aiService->optimizeContent(
                $request->input('content'),
                $request->input('objective'),
                [
                    'platform' => $request->input('platform'),
                    'audience' => $request->input('audience')
                ],
                $user
            );

            return response()->json($result);

        } catch (\Exception $e) {
            \Log::error('Erreur optimisation contenu', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'optimisation'
            ], 500);
        }
    }

    /**
     * Envoyer des messages WhatsApp en masse avec IA
     */
    public function sendBulkWhatsApp(Request $request): JsonResponse
    {
        $request->validate([
            'client_ids' => 'required|array',
            'client_ids.*' => 'exists:clients,id',
            'template' => 'required|string',
            'use_ai_personalization' => 'boolean'
        ]);

        $user = Auth::user();
        $clientIds = $request->input('client_ids');
        $template = $request->input('template');
        $useAI = $request->input('use_ai_personalization', false);

        try {
            $result = $this->whatsappService->sendBulkPersonalizedMessages(
                $clientIds, 
                $template, 
                $user->id,
                ['use_ai' => $useAI]
            );

            return response()->json($result);

        } catch (\Exception $e) {
            \Log::error('Erreur envoi WhatsApp en masse', [
                'user_id' => $user->id,
                'client_count' => count($clientIds),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'envoi en masse'
            ], 500);
        }
    }

    /**
     * Obtenir l'activité récente de l'utilisateur
     */
    protected function getUserRecentActivity($user): array
    {
        return [
            'last_login' => $user->last_login_at?->diffForHumans(),
            'recent_clients' => $user->clients()->latest()->limit(3)->get(['id', 'name'])->toArray(),
            'recent_campaigns' => $user->campaigns()->latest()->limit(2)->get(['id', 'name', 'status'])->toArray(),
            'messages_this_week' => $user->messages()->where('created_at', '>=', now()->subWeek())->count()
        ];
    }

    /**
     * Obtenir les statistiques du chat
     */
    public function getChatStats(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        try {
            $stats = [
                'total_conversations' => AiConversation::where('user_id', $user->id)->count(),
                'messages_today' => AiConversation::where('user_id', $user->id)
                    ->whereDate('last_activity_at', today())
                    ->sum('messages->*.content') ?? 0,
                'generated_content' => $user->generatedContents()->count(),
                'whatsapp_sessions' => $user->whatsappSessions()->where('is_verified', true)->count(),
                'automation_rules' => $user->automationRules()->where('status', 'active')->count()
            ];

            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération des statistiques'
            ], 500);
        }
    }
}
