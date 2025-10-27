<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Message;
use App\Models\Campaign;
use App\Models\Visit;
use App\Models\Tag;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StatisticsController extends Controller
{
    /**
     * Obtenir les statistiques essentielles pour le dashboard
     */
    public function getDashboardStats(Request $request)
    {
        $user = $request->user();
        $timeRange = $request->get('time_range', 'month'); // week, month, year
        
        $dateFrom = $this->getDateFrom($timeRange);
        
        $stats = [
            // Statistiques de base
            'total_clients' => $user->clients()->count(),
            'active_clients' => $user->clients()->active()->count(),
            'inactive_clients' => $user->clients()->inactive()->count(),
            'opted_out_clients' => $user->clients()->where('opt_out', true)->count(),
            
            // Messages
            'total_messages' => $user->messages()->count(),
            'messages_this_period' => $user->messages()->where('created_at', '>=', $dateFrom)->count(),
            'messages_sent' => $user->messages()->where('status', 'sent')->count(),
            'messages_delivered' => $user->messages()->where('status', 'delivered')->count(),
            'messages_failed' => $user->messages()->where('status', 'failed')->count(),
            'delivery_rate' => $this->calculateDeliveryRate($user, $dateFrom),
            
            // Campagnes
            'total_campaigns' => $user->campaigns()->count(),
            'active_campaigns' => $user->campaigns()->whereIn('status', ['scheduled', 'sending'])->count(),
            'completed_campaigns' => $user->campaigns()->where('status', 'sent')->count(),
            'campaign_success_rate' => $this->calculateCampaignSuccessRate($user),
            
            // Visites et interactions
            'total_visits' => Visit::whereHas('client', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->count(),
            'visits_this_period' => Visit::whereHas('client', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->where('visit_date', '>=', $dateFrom)->count(),
            
            // Tags
            'total_tags' => $user->tags()->count(),
            'tagged_clients' => $user->clients()->whereHas('tags')->count(),
            
            // Tendance
            'client_growth_rate' => $this->calculateClientGrowthRate($user, $dateFrom),
            'engagement_rate' => $this->calculateEngagementRate($user, $dateFrom),
            
            // Données temporelles pour les graphiques
            'messages_by_day' => $this->getMessagesByDay($user, $dateFrom),
            'clients_by_day' => $this->getClientsByDay($user, $dateFrom),
            'visits_by_day' => $this->getVisitsByDay($user, $dateFrom),
            
            // Répartition par tags
            'clients_by_tags' => $this->getClientsByTags($user),
            
            // Types d'interactions
            'interaction_types' => $this->getInteractionTypes($user),
        ];
        
        return response()->json($stats);
    }
    
    /**
     * Obtenir les statistiques personnalisées
     */
    public function getCustomStats(Request $request)
    {
        $user = $request->user();
        $filters = $request->all();
        
        $query = $this->buildCustomQuery($user, $filters);
        
        $stats = [
            'total_count' => $query->count(),
            'filters_applied' => $filters,
            'breakdown' => $this->getCustomBreakdown($query, $filters),
            'time_series' => $this->getCustomTimeSeries($query, $filters),
        ];
        
        return response()->json($stats);
    }
    
    /**
     * Obtenir les données disponibles pour la personnalisation
     */
    public function getAvailableData(Request $request)
    {
        $user = $request->user();
        
        $availableData = [
            'entities' => [
                'clients' => [
                    'label' => 'Clients',
                    'fields' => [
                        'name', 'phone', 'email', 'gender', 'opt_out', 
                        'birthday', 'address', 'created_at', 'last_message_date'
                    ]
                ],
                'messages' => [
                    'label' => 'Messages',
                    'fields' => [
                        'content', 'status', 'type', 'is_reply', 
                        'sent_at', 'delivered_at', 'created_at'
                    ]
                ],
                'campaigns' => [
                    'label' => 'Campagnes',
                    'fields' => [
                        'name', 'status', 'scheduled_at', 'recipients_count',
                        'delivered_count', 'failed_count', 'created_at'
                    ]
                ],
                'visits' => [
                    'label' => 'Visites',
                    'fields' => [
                        'visit_date', 'interaction_type', 'notes', 'created_at'
                    ]
                ],
                'tags' => [
                    'label' => 'Tags',
                    'fields' => [
                        'name', 'created_at'
                    ]
                ]
            ],
            'filters' => [
                'date_ranges' => ['today', 'week', 'month', 'quarter', 'year', 'custom'],
                'statuses' => [
                    'clients' => ['active', 'inactive', 'opted_out', 'opted_in'],
                    'messages' => ['sent', 'delivered', 'failed', 'pending'],
                    'campaigns' => ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled']
                ],
                'interaction_types' => $this->getUniqueInteractionTypes($user),
                'tags' => $user->tags()->pluck('name', 'id')->toArray()
            ],
            'group_by_options' => [
                'date' => ['day', 'week', 'month', 'year'],
                'status' => ['message_status', 'campaign_status', 'client_status'],
                'tags' => ['tag_name', 'tag_count'],
                'interaction_type' => ['type', 'count']
            ]
        ];
        
        return response()->json($availableData);
    }
    
    /**
     * Exporter les statistiques
     */
    public function exportStats(Request $request)
    {
        $user = $request->user();
        $format = $request->get('format', 'csv');
        $filters = $request->except('format');
        
        $data = $this->getCustomStats($request);
        
        // Ici vous pouvez implémenter l'export selon le format demandé
        // Pour l'instant, retournons les données JSON
        return response()->json([
            'export_data' => $data,
            'format' => $format,
            'exported_at' => now()
        ]);
    }
    
    // Méthodes privées utilitaires
    
    private function getDateFrom($timeRange)
    {
        switch ($timeRange) {
            case 'week':
                return Carbon::now()->subWeek();
            case 'month':
                return Carbon::now()->subMonth();
            case 'year':
                return Carbon::now()->subYear();
            default:
                return Carbon::now()->subMonth();
        }
    }
    
    private function calculateDeliveryRate($user, $dateFrom)
    {
        $totalSent = $user->messages()->where('created_at', '>=', $dateFrom)->count();
        if ($totalSent === 0) return 0;
        
        $delivered = $user->messages()
            ->where('created_at', '>=', $dateFrom)
            ->where('status', 'delivered')
            ->count();
            
        return round(($delivered / $totalSent) * 100, 2);
    }
    
    private function calculateCampaignSuccessRate($user)
    {
        $totalCampaigns = $user->campaigns()->count();
        if ($totalCampaigns === 0) return 0;
        
        $successfulCampaigns = $user->campaigns()
            ->where('status', 'sent')
            ->count();
            
        return round(($successfulCampaigns / $totalCampaigns) * 100, 2);
    }
    
    private function calculateClientGrowthRate($user, $dateFrom)
    {
        $currentClients = $user->clients()->count();
        $previousClients = $user->clients()
            ->where('created_at', '<', $dateFrom)
            ->count();
            
        if ($previousClients === 0) return $currentClients > 0 ? 100 : 0;
        
        return round((($currentClients - $previousClients) / $previousClients) * 100, 2);
    }
    
    private function calculateEngagementRate($user, $dateFrom)
    {
        $totalClients = $user->clients()->count();
        if ($totalClients === 0) return 0;
        
        $engagedClients = $user->clients()
            ->whereHas('messages', function($q) use ($dateFrom) {
                $q->where('created_at', '>=', $dateFrom);
            })
            ->count();
            
        return round(($engagedClients / $totalClients) * 100, 2);
    }
    
    private function getMessagesByDay($user, $dateFrom)
    {
        return $user->messages()
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', $dateFrom)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->date,
                    'count' => $item->count
                ];
            });
    }
    
    private function getClientsByDay($user, $dateFrom)
    {
        return $user->clients()
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', $dateFrom)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->date,
                    'count' => $item->count
                ];
            });
    }
    
    private function getVisitsByDay($user, $dateFrom)
    {
        return Visit::whereHas('client', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->select(DB::raw('DATE(visit_date) as date'), DB::raw('count(*) as count'))
            ->where('visit_date', '>=', $dateFrom)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => $item->date,
                    'count' => $item->count
                ];
            });
    }
    
    private function getClientsByTags($user)
    {
        return $user->tags()
            ->withCount('clients')
            ->get()
            ->map(function($tag) {
                return [
                    'tag_name' => $tag->name,
                    'clients_count' => $tag->clients_count
                ];
            });
    }
    
    private function getInteractionTypes($user)
    {
        return Visit::whereHas('client', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->select('interaction_type', DB::raw('count(*) as count'))
            ->groupBy('interaction_type')
            ->get()
            ->map(function($item) {
                return [
                    'type' => $item->interaction_type ?: 'Non spécifié',
                    'count' => $item->count
                ];
            });
    }
    
    private function getUniqueInteractionTypes($user)
    {
        return Visit::whereHas('client', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->distinct()
            ->pluck('interaction_type')
            ->filter()
            ->values()
            ->toArray();
    }
    
    private function buildCustomQuery($user, $filters)
    {
        $entity = $filters['entity'] ?? 'clients';
        
        switch ($entity) {
            case 'clients':
                $query = $user->clients();
                break;
            case 'messages':
                $query = $user->messages();
                break;
            case 'campaigns':
                $query = $user->campaigns();
                break;
            case 'visits':
                $query = Visit::whereHas('client', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                });
                break;
            default:
                $query = $user->clients();
        }
        
        // Appliquer les filtres
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }
        
        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }
        
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (isset($filters['tags']) && $entity === 'clients') {
            $query->whereHas('tags', function($q) use ($filters) {
                $q->whereIn('tags.id', $filters['tags']);
            });
        }
        
        return $query;
    }
    
    private function getCustomBreakdown($query, $filters)
    {
        $groupBy = $filters['group_by'] ?? 'status';
        
        return $query->select($groupBy, DB::raw('count(*) as count'))
            ->groupBy($groupBy)
            ->get()
            ->map(function($item) use ($groupBy) {
                return [
                    'label' => $item->$groupBy ?: 'Non spécifié',
                    'count' => $item->count
                ];
            });
    }
    
    private function getCustomTimeSeries($query, $filters)
    {
        $period = $filters['period'] ?? 'day';
        
        $dateFormat = match($period) {
            'week' => '%Y-%u',
            'month' => '%Y-%m',
            'year' => '%Y',
            default => '%Y-%m-%d'
        };
        
        return $query->select(
                DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as period"),
                DB::raw('count(*) as count')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function($item) {
                return [
                    'period' => $item->period,
                    'count' => $item->count
                ];
            });
    }
}
