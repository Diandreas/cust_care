<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketingClient;
use App\Models\MarketingCampaign;
use App\Models\MarketingAutomationRule;
use App\Models\MarketingContentTemplate;
use App\Models\MarketingFlyer;
use App\Models\MarketingMessage;
use App\Services\WhatsAppService;
use App\Services\AIContentService;
use App\Services\MarketingAutomationService;
use App\Services\FlyerGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class MarketingController extends Controller
{
    protected $whatsappService;
    protected $aiService;
    protected $automationService;
    protected $flyerService;

    public function __construct(
        WhatsAppService $whatsappService,
        AIContentService $aiService,
        MarketingAutomationService $automationService,
        FlyerGeneratorService $flyerService
    ) {
        $this->whatsappService = $whatsappService;
        $this->aiService = $aiService;
        $this->automationService = $automationService;
        $this->flyerService = $flyerService;
    }

    /**
     * Obtenir le tableau de bord marketing
     */
    public function dashboard(): JsonResponse
    {
        $userId = Auth::id();

        try {
            // Statistiques des clients
            $clientStats = [
                'total' => MarketingClient::where('user_id', $userId)->count(),
                'active' => MarketingClient::where('user_id', $userId)->active()->count(),
                'inactive' => MarketingClient::where('user_id', $userId)->inactive()->count(),
                'opted_out' => MarketingClient::where('user_id', $userId)->optedOut()->count(),
                'with_birthday_today' => MarketingClient::where('user_id', $userId)
                    ->active()
                    ->whereRaw("DATE_FORMAT(birthday, '%m-%d') = ?", [now()->format('m-d')])
                    ->count(),
            ];

            // Statistiques des campagnes
            $campaignStats = [
                'total' => MarketingCampaign::where('user_id', $userId)->count(),
                'active' => MarketingCampaign::where('user_id', $userId)->active()->count(),
                'scheduled' => MarketingCampaign::where('user_id', $userId)->scheduled()->count(),
                'completed' => MarketingCampaign::where('user_id', $userId)->completed()->count(),
            ];

            // Statistiques des messages
            $messageStats = $this->whatsappService->getStats($userId, 'month');

            // Statistiques des automatisations
            $automationStats = $this->automationService->getAutomationStats($userId);

            // Statistiques des flyers
            $flyerStats = [
                'total' => MarketingFlyer::where('user_id', $userId)->count(),
                'published' => MarketingFlyer::where('user_id', $userId)->published()->count(),
                'draft' => MarketingFlyer::where('user_id', $userId)->where('status', 'draft')->count(),
            ];

            // Récents
            $recentClients = MarketingClient::where('user_id', $userId)
                ->latest()
                ->take(5)
                ->get(['id', 'name', 'phone', 'status', 'created_at']);

            $recentCampaigns = MarketingCampaign::where('user_id', $userId)
                ->latest()
                ->take(5)
                ->get(['id', 'name', 'type', 'status', 'created_at']);

            $recentMessages = MarketingMessage::where('user_id', $userId)
                ->latest()
                ->take(10)
                ->get(['id', 'type', 'status', 'created_at']);

            return response()->json([
                'success' => true,
                'data' => [
                    'clients' => $clientStats,
                    'campaigns' => $campaignStats,
                    'messages' => $messageStats,
                    'automations' => $automationStats,
                    'flyers' => $flyerStats,
                    'recent' => [
                        'clients' => $recentClients,
                        'campaigns' => $recentCampaigns,
                        'messages' => $recentMessages,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du tableau de bord',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques détaillées
     */
    public function stats(Request $request): JsonResponse
    {
        $userId = Auth::id();
        $period = $request->get('period', 'month');
        $type = $request->get('type', 'all');

        try {
            $stats = [];

            if ($type === 'all' || $type === 'clients') {
                $stats['clients'] = $this->getClientStats($userId, $period);
            }

            if ($type === 'all' || $type === 'campaigns') {
                $stats['campaigns'] = $this->getCampaignStats($userId, $period);
            }

            if ($type === 'all' || $type === 'messages') {
                $stats['messages'] = $this->whatsappService->getStats($userId, $period);
            }

            if ($type === 'all' || $type === 'automations') {
                $stats['automations'] = $this->automationService->getAutomationStats($userId, $period);
            }

            if ($type === 'all' || $type === 'flyers') {
                $stats['flyers'] = $this->getFlyerStats($userId, $period);
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
                'period' => $period,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques des clients
     */
    protected function getClientStats(int $userId, string $period): array
    {
        $query = MarketingClient::where('user_id', $userId);

        switch ($period) {
            case 'today':
                $query->whereDate('created_at', today());
                break;
            case 'week':
                $query->whereBetween('created_at', [
                    now()->startOfWeek(),
                    now()->endOfWeek()
                ]);
                break;
            case 'month':
                $query->whereMonth('created_at', now()->month)
                      ->whereYear('created_at', now()->year);
                break;
        }

        $total = $query->count();
        $active = $query->active()->count();
        $inactive = $query->inactive()->count();
        $optedOut = $query->optedOut()->count();

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'opted_out' => $optedOut,
            'active_rate' => $total > 0 ? round(($active / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Obtenir les statistiques des campagnes
     */
    protected function getCampaignStats(int $userId, string $period): array
    {
        $query = MarketingCampaign::where('user_id', $userId);

        switch ($period) {
            case 'today':
                $query->whereDate('created_at', today());
                break;
            case 'week':
                $query->whereBetween('created_at', [
                    now()->startOfWeek(),
                    now()->endOfWeek()
                ]);
                break;
            case 'month':
                $query->whereMonth('created_at', now()->month)
                      ->whereYear('created_at', now()->year);
                break;
        }

        $total = $query->count();
        $active = $query->active()->count();
        $scheduled = $query->scheduled()->count();
        $completed = $query->completed()->count();
        $cancelled = $query->where('status', 'cancelled')->count();

        return [
            'total' => $total,
            'active' => $active,
            'scheduled' => $scheduled,
            'completed' => $completed,
            'cancelled' => $cancelled,
            'success_rate' => $total > 0 ? round((($active + $completed) / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Obtenir les statistiques des flyers
     */
    protected function getFlyerStats(int $userId, string $period): array
    {
        $query = MarketingFlyer::where('user_id', $userId);

        switch ($period) {
            case 'today':
                $query->whereDate('created_at', today());
                break;
            case 'week':
                $query->whereBetween('created_at', [
                    now()->startOfWeek(),
                    now()->endOfWeek()
                ]);
                break;
            case 'month':
                $query->whereMonth('created_at', now()->month)
                      ->whereYear('created_at', now()->year);
                break;
        }

        $total = $query->count();
        $published = $query->published()->count();
        $draft = $query->where('status', 'draft')->count();
        $archived = $query->where('status', 'archived')->count();

        return [
            'total' => $total,
            'published' => $published,
            'draft' => $draft,
            'archived' => $archived,
            'publish_rate' => $total > 0 ? round(($published / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Tester la connexion des services
     */
    public function testServices(): JsonResponse
    {
        try {
            $results = [];

            // Test WhatsApp/Twilio
            $whatsappTest = $this->whatsappService->testConnection();
            $results['whatsapp'] = $whatsappTest;

            // Test OpenAI
            $openaiTest = $this->aiService->testConnection();
            $results['openai'] = $openaiTest;

            // Vérifier les modèles
            $results['models'] = [
                'clients' => MarketingClient::count(),
                'campaigns' => MarketingCampaign::count(),
                'automations' => MarketingAutomationRule::count(),
                'templates' => MarketingContentTemplate::count(),
                'flyers' => MarketingFlyer::count(),
                'messages' => MarketingMessage::count(),
            ];

            $allWorking = $whatsappTest['success'] && $openaiTest['success'];

            return response()->json([
                'success' => true,
                'data' => $results,
                'all_services_working' => $allWorking,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du test des services',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les informations de configuration
     */
    public function getConfig(): JsonResponse
    {
        try {
            $config = [
                'whatsapp' => [
                    'enabled' => !empty(config('services.twilio.sid')),
                    'from_number' => config('services.twilio.whatsapp_number'),
                ],
                'openai' => [
                    'enabled' => !empty(config('services.openai.api_key')),
                    'model' => config('services.openai.model', 'gpt-4'),
                    'max_tokens' => config('services.openai.max_tokens', 2000),
                ],
                'features' => [
                    'whatsapp' => true,
                    'ai_content' => true,
                    'automation' => true,
                    'flyers' => true,
                    'campaigns' => true,
                    'templates' => true,
                ],
                'limits' => [
                    'max_clients' => 10000,
                    'max_campaigns' => 1000,
                    'max_automations' => 100,
                    'max_flyers' => 500,
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $config,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la configuration',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les rapports de performance
     */
    public function getPerformanceReport(Request $request): JsonResponse
    {
        $userId = Auth::id();
        $startDate = $request->get('start_date', now()->subMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));

        try {
            // Performance des campagnes
            $campaigns = MarketingCampaign::where('user_id', $userId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $campaignPerformance = [];
            foreach ($campaigns as $campaign) {
                $campaign->updateMetrics();
                $campaignPerformance[] = [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'type' => $campaign->type,
                    'status' => $campaign->status,
                    'metrics' => $campaign->metrics,
                    'created_at' => $campaign->created_at,
                ];
            }

            // Performance des messages
            $messages = MarketingMessage::where('user_id', $userId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $messageStats = [
                'total' => $messages->count(),
                'whatsapp' => $messages->ofType('whatsapp')->count(),
                'email' => $messages->ofType('email')->count(),
                'sent' => $messages->sent()->count(),
                'delivered' => $messages->delivered()->count(),
                'read' => $messages->read()->count(),
                'failed' => $messages->failed()->count(),
            ];

            // Performance des automatisations
            $automations = MarketingAutomationRule::where('user_id', $userId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $automationStats = [
                'total' => $automations->count(),
                'active' => $automations->active()->count(),
                'total_executions' => $automations->sum('execution_count'),
                'avg_executions' => $automations->avg('execution_count'),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'campaigns' => $campaignPerformance,
                    'messages' => $messageStats,
                    'automations' => $automationStats,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du rapport de performance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les suggestions d'amélioration
     */
    public function getImprovementSuggestions(): JsonResponse
    {
        $userId = Auth::id();

        try {
            $suggestions = [];

            // Analyser les clients
            $clientCount = MarketingClient::where('user_id', $userId)->count();
            if ($clientCount < 10) {
                $suggestions[] = [
                    'type' => 'clients',
                    'priority' => 'high',
                    'title' => 'Augmenter votre base clients',
                    'description' => 'Vous avez moins de 10 clients. Considérez des stratégies d\'acquisition.',
                    'action' => 'Ajouter des clients manuellement ou importer une liste',
                ];
            }

            // Analyser les campagnes
            $activeCampaigns = MarketingCampaign::where('user_id', $userId)->active()->count();
            if ($activeCampaigns === 0) {
                $suggestions[] = [
                    'type' => 'campaigns',
                    'priority' => 'high',
                    'title' => 'Créer votre première campagne',
                    'description' => 'Aucune campagne active. Commencez par une campagne de bienvenue.',
                    'action' => 'Créer une campagne WhatsApp de bienvenue',
                ];
            }

            // Analyser les automatisations
            $automationCount = MarketingAutomationRule::where('user_id', $userId)->active()->count();
            if ($automationCount === 0) {
                $suggestions[] = [
                    'type' => 'automation',
                    'priority' => 'medium',
                    'title' => 'Configurer des automatisations',
                    'description' => 'Aucune automatisation active. Automatisez vos communications.',
                    'action' => 'Créer une règle d\'anniversaire automatique',
                ];
            }

            // Analyser l'engagement
            $recentMessages = MarketingMessage::where('user_id', $userId)
                ->where('created_at', '>=', now()->subDays(7))
                ->count();

            if ($recentMessages === 0) {
                $suggestions[] = [
                    'type' => 'engagement',
                    'priority' => 'medium',
                    'title' => 'Augmenter l\'engagement',
                    'description' => 'Aucun message envoyé cette semaine. Gardez vos clients engagés.',
                    'action' => 'Planifier des messages réguliers',
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'suggestions' => $suggestions,
                    'total' => count($suggestions),
                    'high_priority' => count(array_filter($suggestions, fn($s) => $s['priority'] === 'high')),
                    'medium_priority' => count(array_filter($suggestions, fn($s) => $s['priority'] === 'medium')),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des suggestions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}