<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Client;
use App\Models\Message;
use App\Models\Visit;
use App\Models\Tag;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Statistiques de base
        $stats = [
            'total_clients' => $user->clients()->count(),
            'total_messages' => $user->messages()->count(),
            'total_campaigns' => $user->campaigns()->count(),
            'total_visits' => $user->clients()->withCount('visits')->get()->sum('visits_count'),
            'recent_messages' => $user->messages()->latest()->take(5)->with('client')->get(),
            'upcoming_campaigns' => $user->campaigns()
                ->where('status', 'scheduled')
                ->where('scheduled_at', '>', now())
                ->orderBy('scheduled_at')
                ->take(3)
                ->get(),
            'subscription' => $this->formatSubscriptionData($user->subscription),
        ];
        
        // Statistiques des campagnes
        $stats['campaign_stats'] = $this->getCampaignStats($user);
        
        // Statistiques des messages
        $stats['message_stats'] = $this->getMessageStats($user);
        
        // Statistiques des clients
        $stats['client_stats'] = $this->getClientStats($user);
        
        // Statistiques des visites
        $stats['visit_stats'] = $this->getVisitStats($user);
        
        // Tendances et engagement
        $stats['trends'] = $this->getEngagementTrends($user);
        
        return Inertia::render('Dashboard', [
            'stats' => $stats
        ]);
    }
    
    private function formatSubscriptionData($subscription)
    {
        if (!$subscription) {
            return null;
        }
        
        $clientsCount = Auth::user()->clients()->count();
        $clientsLimit = $subscription->clients_limit ?? 50;
        
        return [
            'id' => $subscription->id,
            'plan' => $subscription->plan,
            'plan_id' => $subscription->plan_id,
            'clients_limit' => $clientsLimit,
            'campaigns_limit' => $subscription->campaigns_limit ?? 0,
            'campaign_sms_limit' => $subscription->campaign_sms_limit ?? 0,
            'personal_sms_quota' => $subscription->personal_sms_quota ?? 0,
            'sms_used' => $subscription->sms_used ?? 0,
            'campaigns_used' => $subscription->campaigns_used ?? 0,
            'next_renewal_date' => $subscription->next_renewal_date ?? now()->addMonth(),
            'auto_renew' => $subscription->auto_renew ?? true,
            'expires_at' => $subscription->expires_at ?? now()->addMonth(),
            'sms_usage_percent' => $this->calculateSmsUsagePercent($subscription),
            'campaigns_usage_percent' => $this->calculateCampaignsUsagePercent($subscription),
            'sms_quota_low' => $this->isSmsQuotaLow($subscription),
            'sms_quota_exhausted' => $this->isSmsQuotaExhausted($subscription),
            'isFreePlan' => $subscription->plan === 'free' || !$subscription->plan_id,
            'clientsCount' => $clientsCount,
        ];
    }
    
    private function calculateSmsUsagePercent($subscription)
    {
        if (!$subscription || $subscription->personal_sms_quota <= 0) {
            return 0;
        }
        
        return min(100, round(($subscription->sms_used / $subscription->personal_sms_quota) * 100, 2));
    }
    
    private function calculateCampaignsUsagePercent($subscription)
    {
        if (!$subscription || $subscription->campaigns_limit <= 0) {
            return 0;
        }
        
        return min(100, round(($subscription->campaigns_used / $subscription->campaigns_limit) * 100, 2));
    }
    
    private function isSmsQuotaLow($subscription)
    {
        if (!$subscription) {
            return false;
        }
        
        return $this->calculateSmsUsagePercent($subscription) >= 80;
    }
    
    private function isSmsQuotaExhausted($subscription)
    {
        if (!$subscription) {
            return false;
        }
        
        return $subscription->sms_used >= $subscription->personal_sms_quota;
    }
    
    /**
     * Récupère les statistiques détaillées sur les campagnes
     * 
     * @param \App\Models\User $user
     * @return array
     */
    private function getCampaignStats($user)
    {
        // Status des campagnes
        $statusCounts = [
            'draft' => $user->campaigns()->where('status', 'draft')->count(),
            'scheduled' => $user->campaigns()->where('status', 'scheduled')->count(),
            'sent' => $user->campaigns()->where('status', 'sent')->count(),
            'failed' => $user->campaigns()->where('status', 'failed')->count(),
            'cancelled' => $user->campaigns()->where('status', 'cancelled')->count(),
        ];
        
        // Taux de succès des campagnes
        $totalSent = $statusCounts['sent'] + $statusCounts['failed'];
        $successRate = $totalSent > 0 ? ($statusCounts['sent'] / $totalSent) * 100 : 0;
        
        // Distribution mensuelle des campagnes (compatible avec SQLite)
        $currentYear = now()->year;
        $campaigns = $user->campaigns()
            ->whereYear('created_at', $currentYear)
            ->get();
            
        // Regrouper manuellement par mois
        $monthCounts = [];
        foreach ($campaigns as $campaign) {
            $month = (int) date('m', strtotime($campaign->created_at));
            if (!isset($monthCounts[$month])) {
                $monthCounts[$month] = 0;
            }
            $monthCounts[$month]++;
        }
        
        // Formater les résultats
        $campaignsByMonth = collect();
        for ($month = 1; $month <= 12; $month++) {
            if (isset($monthCounts[$month]) && $monthCounts[$month] > 0) {
                $campaignsByMonth->push([
                    'month' => date('F', mktime(0, 0, 0, $month, 10)),
                    'count' => $monthCounts[$month],
                ]);
            }
        }
            
        return [
            'status_counts' => $statusCounts,
            'success_rate' => $successRate,
            'success_rate_formatted' => round($successRate, 1) . '%',
            'by_month' => $campaignsByMonth,
        ];
    }
    
    /**
     * Récupère les statistiques détaillées sur les messages
     *
     * @param \App\Models\User $user
     * @return array
     */
    private function getMessageStats($user)
    {
        // Status des messages
        $statusCounts = [
            'sent' => $user->messages()->where('status', 'sent')->count(),
            'failed' => $user->messages()->where('status', 'failed')->count(),
            'pending' => $user->messages()->where('status', 'pending')->count(),
        ];
        
        // Taux de livraison des messages
        $totalSent = $statusCounts['sent'] + $statusCounts['failed'];
        $deliveryRate = $totalSent > 0 ? ($statusCounts['sent'] / $totalSent) * 100 : 0;
        
        // Distribution quotidienne des messages (compatible avec SQLite)
        $startDate = now()->subDays(30);
        $messages = $user->messages()
            ->where('created_at', '>=', $startDate)
            ->get();
            
        // Regrouper manuellement par jour
        $dayCounts = [];
        foreach ($messages as $message) {
            $date = date('Y-m-d', strtotime($message->created_at));
            if (!isset($dayCounts[$date])) {
                $dayCounts[$date] = 0;
            }
            $dayCounts[$date]++;
        }
        
        // Formater les résultats
        $messagesByDay = collect();
        foreach ($dayCounts as $date => $count) {
            $messagesByDay->push([
                'date' => $date,
                'count' => $count,
            ]);
        }
        
        // Trier par date
        $messagesByDay = $messagesByDay->sortBy('date')->values();
            
        return [
            'status_counts' => $statusCounts,
            'delivery_rate' => $deliveryRate,
            'delivery_rate_formatted' => round($deliveryRate, 1) . '%',
            'by_day' => $messagesByDay,
        ];
    }
    
    /**
     * Récupère les statistiques détaillées sur les clients
     *
     * @param \App\Models\User $user
     * @return array
     */
    private function getClientStats($user)
    {
        // Nouveaux clients ce mois (compatible avec SQLite)
        $startOfMonth = now()->startOfMonth()->format('Y-m-d H:i:s');
        $endOfMonth = now()->endOfMonth()->format('Y-m-d H:i:s');
        
        $newThisMonth = $user->clients()
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->count();
            
        // Nouveaux clients le mois dernier
        $lastMonth = now()->subMonth();
        $startOfLastMonth = $lastMonth->copy()->startOfMonth()->format('Y-m-d H:i:s');
        $endOfLastMonth = $lastMonth->copy()->endOfMonth()->format('Y-m-d H:i:s');
        
        $lastMonthCount = $user->clients()
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->count();
            
        // Taux de croissance
        $growthRate = $lastMonthCount > 0 ? (($newThisMonth - $lastMonthCount) / $lastMonthCount) * 100 : 0;
        $growthIsPositive = $growthRate >= 0;
        
        // Clients par tag
        $clientsByTag = $user->clients()
            ->with('tags')
            ->get()
            ->flatMap(function($client) {
                return $client->tags;
            })
            ->groupBy('name')
            ->map(function($group) {
                return [
                    'name' => $group[0]->name,
                    'count' => $group->count(),
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->take(5);
            
        return [
            'new_this_month' => $newThisMonth,
            'growth_rate' => abs($growthRate),
            'growth_rate_formatted' => round(abs($growthRate), 1) . '%',
            'growth_is_positive' => $growthIsPositive,
            'by_tag' => $clientsByTag,
        ];
    }
    
    /**
     * Récupère les statistiques détaillées sur les visites
     *
     * @param \App\Models\User $user
     * @return array
     */
    private function getVisitStats($user)
    {
        // Visites ce mois (compatible avec SQLite)
        $currentMonth = now()->month;
        $currentYear = now()->year;
        $startOfMonth = now()->startOfMonth()->format('Y-m-d');
        $endOfMonth = now()->endOfMonth()->format('Y-m-d');
        
        $visitsThisMonth = $user->clients()
            ->with(['visits' => function($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('visit_date', [$startOfMonth, $endOfMonth]);
            }])
            ->get()
            ->pluck('visits')
            ->flatten()
            ->count();
            
        // Visites le mois dernier
        $lastMonth = now()->subMonth();
        $startOfLastMonth = $lastMonth->copy()->startOfMonth()->format('Y-m-d');
        $endOfLastMonth = $lastMonth->copy()->endOfMonth()->format('Y-m-d');
        
        $visitsLastMonth = $user->clients()
            ->with(['visits' => function($query) use ($startOfLastMonth, $endOfLastMonth) {
                $query->whereBetween('visit_date', [$startOfLastMonth, $endOfLastMonth]);
            }])
            ->get()
            ->pluck('visits')
            ->flatten()
            ->count();
            
        // Taux de croissance
        $growthRate = $visitsLastMonth > 0 ? (($visitsThisMonth - $visitsLastMonth) / $visitsLastMonth) * 100 : 0;
        $growthIsPositive = $growthRate >= 0;
        
        // Distribution quotidienne des visites
        $allVisits = $user->clients()
            ->with(['visits' => function($query) {
                $query->where('visit_date', '>=', now()->subDays(30));
            }])
            ->get()
            ->pluck('visits')
            ->flatten();
            
        $visitsByDay = $allVisits
            ->groupBy(function($visit) {
                return date('Y-m-d', strtotime($visit->visit_date));
            })
            ->map(function($group, $date) {
                return [
                    'date' => $date,
                    'count' => $group->count(),
                ];
            })
            ->values();
            
        return [
            'total' => $user->clients()->withCount('visits')->get()->sum('visits_count'),
            'this_month' => $visitsThisMonth,
            'growth_rate' => abs($growthRate),
            'growth_rate_formatted' => round(abs($growthRate), 1) . '%',
            'growth_is_positive' => $growthIsPositive,
            'by_day' => $visitsByDay,
        ];
    }
    
    /**
     * Récupère les tendances et métriques d'engagement
     *
     * @param \App\Models\User $user
     * @return array
     */
    private function getEngagementTrends($user)
    {
        // Clients actifs (compatible avec SQLite)
        $startOfMonth = now()->startOfMonth()->format('Y-m-d');
        $endOfMonth = now()->endOfMonth()->format('Y-m-d');
        
        $activeClients = $user->clients()
            ->where(function($query) use ($startOfMonth, $endOfMonth) {
                $query->whereHas('visits', function($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereBetween('visit_date', [$startOfMonth, $endOfMonth]);
                })
                ->orWhereHas('messages', function($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
                });
            })
            ->count();
            
        $totalClients = $user->clients()->count();
        $activeRate = $totalClients > 0 ? ($activeClients / $totalClients) * 100 : 0;
        
        // Comparer avec le mois dernier
        $lastMonth = now()->subMonth();
        $startOfLastMonth = $lastMonth->copy()->startOfMonth()->format('Y-m-d');
        $endOfLastMonth = $lastMonth->copy()->endOfMonth()->format('Y-m-d');
        
        $lastMonthActiveClients = $user->clients()
            ->where(function($query) use ($startOfLastMonth, $endOfLastMonth) {
                $query->whereHas('visits', function($q) use ($startOfLastMonth, $endOfLastMonth) {
                    $q->whereBetween('visit_date', [$startOfLastMonth, $endOfLastMonth]);
                })
                ->orWhereHas('messages', function($q) use ($startOfLastMonth, $endOfLastMonth) {
                    $q->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth]);
                });
            })
            ->count();
            
        $lastMonthTotalClients = $user->clients()
            ->where('created_at', '<', now()->startOfMonth()->format('Y-m-d'))
            ->count();
            
        $lastMonthRate = $lastMonthTotalClients > 0 ? ($lastMonthActiveClients / $lastMonthTotalClients) * 100 : 0;
        $trendRate = $lastMonthRate > 0 ? (($activeRate - $lastMonthRate) / $lastMonthRate) * 100 : 0;
        $trendIsPositive = $trendRate >= 0;
        
        // Engagement (clients qui ont répondu à au moins un message) - compatible avec MySQL
        $messagedClients = $user->clients()
            ->whereHas('messages', function($query) use ($startOfMonth, $endOfMonth) {
                $query->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
            })
            ->count();
            
        // Pour l'instant, on considère qu'aucun client n'a répondu puisque la colonne is_reply vient d'être ajoutée
        // et n'est pas encore remplie avec des données réelles
        $engagedClients = 0;
            
        $engagementRate = $messagedClients > 0 ? ($engagedClients / $messagedClients) * 100 : 0;
        
        return [
            'active_clients' => [
                'count' => $activeClients,
                'rate' => $activeRate,
                'rate_formatted' => round($activeRate, 1) . '%',
                'trend' => abs($trendRate),
                'trend_formatted' => round(abs($trendRate), 1) . '%',
                'trend_is_positive' => $trendIsPositive,
            ],
            'engagement' => [
                'rate' => $engagementRate,
                'rate_formatted' => round($engagementRate, 1) . '%',
                'engaged_clients' => $engagedClients,
                'messaged_clients' => $messagedClients,
            ],
        ];
    }
    private function getCampaignStatistics($user)
    {
        // Nombre de campagnes par statut
        $statusCounts = Campaign::where('user_id', $user->id)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
        
        // S'assurer que tous les statuts sont représentés même s'ils sont à zéro
        $allStatuses = ['draft', 'scheduled', 'sent', 'failed', 'cancelled'];
        foreach ($allStatuses as $status) {
            if (!isset($statusCounts[$status])) {
                $statusCounts[$status] = 0;
            }
        }
        
        // Taux de réussite des campagnes (éviter NaN%)
        $totalSent = $statusCounts['sent'] ?? 0;
        $totalFailed = $statusCounts['failed'] ?? 0;
        $totalAttempted = $totalSent + $totalFailed;
        
        $successRate = $totalAttempted > 0 
            ? round(($totalSent / $totalAttempted) * 100, 1) 
            : 0;
        
        // Campagnes par mois (compatible avec SQLite)
        $sixMonthsAgo = now()->subMonths(6);
        $campaigns = Campaign::where('user_id', $user->id)
            ->where('created_at', '>=', $sixMonthsAgo)
            ->get();
            
        // Utiliser un tableau associatif standard pour le regroupement
        $campaignMonths = [];
        foreach ($campaigns as $campaign) {
            $date = Carbon::parse($campaign->created_at);
            $monthYear = $date->format('Y-m');
            
            if (!isset($campaignMonths[$monthYear])) {
                $campaignMonths[$monthYear] = [
                    'month' => $date->format('M Y'),
                    'count' => 0
                ];
            }
            
            $campaignMonths[$monthYear]['count']++;
        }
        
        // Convertir en collection et trier chronologiquement
        $campaignsByMonth = collect(array_values($campaignMonths))->sortBy(function ($item) {
            return Carbon::parse('01 ' . $item['month'])->timestamp;
        })->values();
        
        return [
            'status_counts' => $statusCounts,
            'success_rate' => $successRate,
            'success_rate_formatted' => $successRate . '%',
            'by_month' => $campaignsByMonth
        ];
    }
    
    /**
     * Récupère les statistiques détaillées sur les messages
     */
    private function getMessageStatistics($user)
    {
        // Nombre total de messages
        $totalMessages = $user->messages()->count();
        
        // Messages par statut
        $statusCounts = Message::where('user_id', $user->id)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
        
        // S'assurer que tous les statuts sont représentés
        $allStatuses = ['sent', 'failed', 'pending'];
        foreach ($allStatuses as $status) {
            if (!isset($statusCounts[$status])) {
                $statusCounts[$status] = 0;
            }
        }
        
        // Taux de livraison (éviter NaN%)
        $totalSent = $statusCounts['sent'] ?? 0;
        $totalFailed = $statusCounts['failed'] ?? 0;
        $totalAttempted = $totalSent + $totalFailed;
        
        $deliveryRate = $totalAttempted > 0 
            ? round(($totalSent / $totalAttempted) * 100, 1) 
            : 0;
        
        // Messages par jour (30 derniers jours) (compatible avec SQLite)
        $thirtyDaysAgo = now()->subDays(30);
        $messages = Message::where('user_id', $user->id)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->get();
            
        // Utiliser un tableau associatif standard
        $messageDays = [];
        foreach ($messages as $message) {
            $date = Carbon::parse($message->created_at)->format('Y-m-d');
            
            if (!isset($messageDays[$date])) {
                $messageDays[$date] = [
                    'date' => Carbon::parse($date)->format('d M'),
                    'count' => 0
                ];
            }
            
            $messageDays[$date]['count']++;
        }
        
        // Convertir en collection et trier chronologiquement
        $messagesByDay = collect(array_values($messageDays))->sortBy(function ($item) {
            // Utiliser le format original qui était Y-m-d pour le tri
            return strtotime($item['date']);
        })->values();
        
        return [
            'status_counts' => $statusCounts,
            'delivery_rate' => $deliveryRate,
            'delivery_rate_formatted' => $deliveryRate . '%',
            'by_day' => $messagesByDay
        ];
    }
    
    /**
     * Récupère les statistiques détaillées sur les clients
     */
    private function getClientStatistics($user)
    {
        // Nombre total de clients
        $totalClients = $user->clients()->count();
        
        // Nouveaux clients ce mois-ci
        $newClientsThisMonth = $user->clients()
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
        
        // Pourcentage de croissance (éviter NaN%)
        $lastMonthClients = $user->clients()
            ->where('created_at', '<', now()->startOfMonth())
            ->where('created_at', '>=', now()->subMonth()->startOfMonth())
            ->count();
        
        $growthRate = $lastMonthClients > 0 
            ? round((($newClientsThisMonth / $lastMonthClients) * 100) - 100, 1)
            : ($newClientsThisMonth > 0 ? 100 : 0);
        
        // Clients par tags
        $clientsByTag = DB::table('client_tag')
            ->join('clients', 'client_tag.client_id', '=', 'clients.id')
            ->join('tags', 'client_tag.tag_id', '=', 'tags.id')
            ->where('clients.user_id', $user->id)
            ->select('tags.name', DB::raw('count(*) as count'))
            ->groupBy('tags.name')
            ->orderByDesc('count')
            ->take(5)
            ->get();
        
        return [
            'new_this_month' => $newClientsThisMonth,
            'growth_rate' => $growthRate,
            'growth_rate_formatted' => $growthRate . '%',
            'growth_is_positive' => $growthRate >= 0,
            'by_tag' => $clientsByTag
        ];
    }
    
    /**
     * Récupère les statistiques détaillées sur les visites
     */
    private function getVisitStatistics($user)
    {
        // Nombre total de visites
        $totalVisits = Visit::whereHas('client', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })->count();
        
        // Visites ce mois-ci
        $visitsThisMonth = Visit::whereHas('client', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('created_at', '>=', now()->startOfMonth())
        ->count();
        
        // Pourcentage de croissance (éviter NaN%)
        $lastMonthVisits = Visit::whereHas('client', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('created_at', '<', now()->startOfMonth())
        ->where('created_at', '>=', now()->subMonth()->startOfMonth())
        ->count();
        
        $growthRate = $lastMonthVisits > 0 
            ? round((($visitsThisMonth / $lastMonthVisits) * 100) - 100, 1)
            : ($visitsThisMonth > 0 ? 100 : 0);
        
        // Visites par jour (30 derniers jours) (compatible avec SQLite)
        $thirtyDaysAgo = now()->subDays(30);
        $visits = Visit::whereHas('client', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('created_at', '>=', $thirtyDaysAgo)
        ->get();
        
        // Utiliser un tableau associatif standard
        $visitDays = [];
        foreach ($visits as $visit) {
            $date = Carbon::parse($visit->created_at)->format('Y-m-d');
            
            if (!isset($visitDays[$date])) {
                $visitDays[$date] = [
                    'date' => Carbon::parse($date)->format('d M'),
                    'count' => 0
                ];
            }
            
            $visitDays[$date]['count']++;
        }
        
        // Convertir en collection et trier chronologiquement
        $visitsByDay = collect(array_values($visitDays))->sortBy(function ($item) {
            // Utiliser le format original qui était Y-m-d pour le tri
            return strtotime($item['date']);
        })->values();
        
        return [
            'total' => $totalVisits,
            'this_month' => $visitsThisMonth,
            'growth_rate' => $growthRate,
            'growth_rate_formatted' => $growthRate . '%',
            'growth_is_positive' => $growthRate >= 0,
            'by_day' => $visitsByDay
        ];
    }
    

} 