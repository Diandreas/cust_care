<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Models\EventType;
use App\Models\UserEventConfig;
use App\Models\Client;
use App\Services\UsageTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EventCalendarController extends Controller
{
    protected $usageTracker;
    
    public function __construct(UsageTrackingService $usageTracker)
    {
        $this->usageTracker = $usageTracker;
    }
    
    /**
     * Affiche le calendrier des événements
     */
    public function index()
    {
        $user = Auth::user();
        
        // Obtenir tous les types d'événements actifs
        $eventTypes = EventType::where('is_active', true)
                             ->orderBy('category')
                             ->orderBy('name')
                             ->get();
        
        // Obtenir les configurations utilisateur pour ces événements
        $userConfigs = UserEventConfig::where('user_id', $user->id)
                                    ->with('eventType')
                                    ->get()
                                    ->keyBy('event_type_id');
        
        // Regrouper les événements par catégorie
        $eventsByCategory = $eventTypes->groupBy('category');
        
        // Préparer les données pour la vue
        $eventCategories = [
            'personal' => [
                'name' => 'Événements personnels',
                'description' => 'Événements liés à vos clients (anniversaires, fêtes de prénoms...)',
                'events' => []
            ],
            'calendar' => [
                'name' => 'Événements du calendrier',
                'description' => 'Événements basés sur des dates fixes (jours fériés, fêtes...)',
                'events' => []
            ],
            'marketing' => [
                'name' => 'Événements marketing',
                'description' => 'Événements pour vos campagnes promotionnelles',
                'events' => []
            ],
            'recurring' => [
                'name' => 'Événements récurrents',
                'description' => 'Événements réguliers et rappels automatiques',
                'events' => []
            ]
        ];
        
        // Combiner les données des types d'événements et des configurations utilisateur
        foreach ($eventsByCategory as $category => $events) {
            if (!isset($eventCategories[$category])) {
                continue;
            }
            
            foreach ($events as $event) {
                $userConfig = $userConfigs[$event->id] ?? null;
                
                $eventCategories[$category]['events'][] = [
                    'id' => $event->id,
                    'code' => $event->code,
                    'name' => $event->name,
                    'description' => $event->description,
                    'default_template' => $event->default_template,
                    'is_active' => $userConfig ? $userConfig->is_active : true,
                    'custom_template' => $userConfig ? $userConfig->custom_template : null,
                    'days_before' => $userConfig ? $userConfig->days_before : 0,
                    'audience_logic' => $event->audience_logic,
                    'audience_override' => $userConfig ? $userConfig->audience_override : null,
                    'last_processed_at' => $userConfig ? $userConfig->last_processed_at : null,
                    'has_config' => !is_null($userConfig)
                ];
            }
        }
        
        // Obtenir les événements du calendrier
        $calendarEvents = $this->getCalendarEvents();
        
        // Obtenir les statistiques des clients
        $clientsStats = $this->getClientsStats();
        
        // Obtenir le quota SMS
        $smsQuota = $this->getSmsQuota($user);
        
        return Inertia::render('AutomaticEvents/Calendar', [
            'eventCategories' => $eventCategories,
            'calendarEvents' => $calendarEvents,
            'clientsStats' => $clientsStats,
            'smsQuota' => $smsQuota
        ]);
    }
    
    /**
     * Activer/désactiver plusieurs événements en même temps
     */
    public function bulkToggle(Request $request)
    {
        $validated = $request->validate([
            'event_ids' => 'required|array',
            'event_ids.*' => 'integer|exists:event_types,id',
            'is_active' => 'required|boolean'
        ]);
        
        $user = Auth::user();
        $eventIds = $validated['event_ids'];
        $isActive = $validated['is_active'];
        
        // Si on active les événements, vérifier le quota SMS
        if ($isActive) {
            $requiredSms = $this->calculateRequiredSms($eventIds);
            $smsQuota = $this->getSmsQuota($user);
            
            if ($requiredSms > $smsQuota['available'] && !$request->has('force')) {
                return response()->json([
                    'status' => 'quota_warning',
                    'message' => 'Quota SMS insuffisant',
                    'required_sms' => $requiredSms,
                    'available_sms' => $smsQuota['available']
                ], 200);
            }
        }
        
        // Mettre à jour les configurations d'événements
        foreach ($eventIds as $eventId) {
            $config = UserEventConfig::firstOrNew([
                'user_id' => $user->id,
                'event_type_id' => $eventId
            ]);
            
            $config->is_active = $isActive;
            $config->save();
        }
        
        return response()->json([
            'status' => 'success',
            'message' => count($eventIds) . ' événements ont été ' . ($isActive ? 'activés' : 'désactivés')
        ]);
    }
    
    /**
     * Obtenir tous les événements du calendrier
     */
    private function getCalendarEvents()
    {
        // Récupérer tous les événements à date fixe de l'année
        $fixedEvents = CalendarEvent::where('is_active', true)
                                   ->orderBy('month')
                                   ->orderBy('day')
                                   ->get();
        
        $events = [
            'fixed' => [],
            'personal' => [
                'count' => [
                    'birthday' => Client::whereNotNull('birthday')->count(),
                    'nameDay' => 0,  // À implémenter si nécessaire
                    'custom' => 0    // À implémenter si nécessaire
                ]
            ]
        ];
        
        // Organiser les événements par mois
        foreach ($fixedEvents as $event) {
            $month = $event->month;
            
            if (!isset($events['fixed'][$month])) {
                $events['fixed'][$month] = [];
            }
            
            $events['fixed'][$month][] = [
                'name' => $event->name,
                'date' => $event->month . '/' . $event->day,
                'category' => $event->category,
                'description' => $event->description,
                'isActive' => $event->is_active,
                'eventId' => $event->id
            ];
        }
        
        return $events;
    }
    
    /**
     * Obtenir les statistiques des clients
     */
    private function getClientsStats()
    {
        $user = Auth::user();
        
        $stats = [
            'total' => $user->clients()->count(),
            'byCategory' => [],
            'byTag' => []
        ];
        
        // Clients par catégorie
        $categoryCounts = $user->categories()
                              ->withCount('clients')
                              ->get();
        
        foreach ($categoryCounts as $category) {
            $stats['byCategory'][] = [
                'category' => $category->id,
                'name' => $category->name,
                'count' => $category->clients_count
            ];
        }
        
        // Clients par tag
        $tagCounts = $user->tags()
                          ->withCount('clients')
                          ->get();
        
        foreach ($tagCounts as $tag) {
            $stats['byTag'][] = [
                'tag' => $tag->id,
                'name' => $tag->name,
                'count' => $tag->clients_count
            ];
        }
        
        return $stats;
    }
    
    /**
     * Obtenir le quota SMS de l'utilisateur
     */
    private function getSmsQuota($user)
    {
        $subscription = $user->subscription;
        
        if (!$subscription) {
            return [
                'available' => 0,
                'used' => 0,
                'total' => 0
            ];
        }
        
        return [
            'available' => $subscription->personal_sms_quota - $subscription->sms_used,
            'used' => $subscription->sms_used,
            'total' => $subscription->personal_sms_quota
        ];
    }
    
    /**
     * Calculer le nombre de SMS nécessaires pour une liste d'événements
     */
    private function calculateRequiredSms(array $eventIds)
    {
        $user = Auth::user();
        $events = EventType::whereIn('id', $eventIds)->get();
        $totalSms = 0;
        
        foreach ($events as $event) {
            // Nombre de clients attendus pour cet événement
            $clientsCount = $this->estimateAudienceSize($event);
            $totalSms += $clientsCount;
        }
        
        return $totalSms;
    }
    
    /**
     * Estimer la taille de l'audience pour un événement
     */
    private function estimateAudienceSize(EventType $event)
    {
        $user = Auth::user();
        $totalClients = $user->clients()->count();
        
        // Si l'événement a une taille d'audience attendue définie
        if ($event->expected_audience_size > 0) {
            return $event->expected_audience_size;
        }
        
        // Sinon, estimer en fonction du type d'événement
        switch ($event->audience_logic) {
            case 'all':
                return $totalClients;
            
            case 'male':
            case 'female':
                // Estimation simplifiée: 50% des clients
                return ceil($totalClients / 2);
            
            case 'specific_category':
                // Vérifier les données du JSON pour trouver la catégorie
                $audienceParams = $event->audience_parameters;
                if (isset($audienceParams['category_id'])) {
                    return $user->clients()
                               ->where('category_id', $audienceParams['category_id'])
                               ->count();
                }
                return ceil($totalClients / 5); // Estimation par défaut
            
            case 'specific_tags':
                // Vérifier les données du JSON pour trouver les tags
                $audienceParams = $event->audience_parameters;
                if (isset($audienceParams['tags']) && !empty($audienceParams['tags'])) {
                    return $user->clients()
                               ->whereHas('tags', function($query) use ($audienceParams) {
                                   $query->whereIn('tags.id', $audienceParams['tags']);
                               })
                               ->count();
                }
                return ceil($totalClients / 5); // Estimation par défaut
            
            default:
                // Pour les événements de type anniversaire
                if (strpos($event->code, 'birthday') !== false) {
                    // Estimation: environ 1/365 des clients ont leur anniversaire un jour donné
                    return max(1, ceil($totalClients / 365));
                }
                
                // Par défaut, on considère 10% des clients
                return ceil($totalClients / 10);
        }
    }
}
