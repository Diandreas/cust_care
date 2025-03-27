<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Models\EventType;
use App\Models\UserEventConfig;
use App\Models\Client;
use App\Services\EventManagerService;
use App\Services\UsageTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class EventCalendarController extends Controller
{
    protected $eventManager;
    protected $usageTracker;

    public function __construct(EventManagerService $eventManager, UsageTrackingService $usageTracker)
    {
        $this->eventManager = $eventManager;
        $this->usageTracker = $usageTracker;
    }

    /**
     * Affiche le calendrier des événements
     */
    public function index()
    {
        $user = Auth::user();

        // Récupérer tous les types d'événements disponibles
        $eventTypes = EventType::where('is_active', true)->get();

        // Récupérer les configurations utilisateur pour ces événements
        $userConfigs = UserEventConfig::where('user_id', $user->id)
            ->with('eventType')
            ->get()
            ->keyBy('event_type_id');

        // Récupérer tous les événements du calendrier (dates fixes)
        $calendarEvents = $this->getCalendarEvents();

        // Récupérer les événements personnels (anniversaires, etc.)
        $personalEvents = $this->getPersonalEvents($user);

        // Combiner tous les événements
        $allEvents = $this->combineEvents($eventTypes, $userConfigs, $calendarEvents, $personalEvents);

        // Récupérer les statistiques sur les clients
        $clientsStats = $this->getClientsStatistics($user);

        // Récupérer le quota SMS de l'utilisateur
        $smsQuota = $this->getSmsQuota($user);

        // Préparer les données pour le calendrier
        $events = $this->prepareEventsForCalendar($allEvents, $userConfigs);

        // Statistiques des événements
        $eventsStats = [
            'total_events' => count($events),
            'active_events' => collect($events)->where('is_active', true)->count(),
            'upcoming_events' => $this->countUpcomingEvents($events),
        ];

        // Catégories d'événements
        $categories = [
            ['id' => 'personal', 'name' => 'Personnel', 'description' => 'Événements liés aux informations personnelles des clients'],
            ['id' => 'holiday', 'name' => 'Jours fériés', 'description' => 'Événements liés aux fêtes nationales et jours fériés'],
            ['id' => 'commercial', 'name' => 'Commercial', 'description' => 'Événements liés aux promotions et offres commerciales'],
            ['id' => 'custom', 'name' => 'Personnalisé', 'description' => 'Événements créés spécifiquement par vous']
        ];

        // Renvoyer les données à la vue
        return Inertia::render('Events/Calendar', [
            'events' => $events,
            'categories' => $categories,
            'stats' => [
                'total_events' => $eventsStats['total_events'],
                'active_events' => $eventsStats['active_events'],
                'upcoming_events' => $eventsStats['upcoming_events'],
                'sms_quota' => $smsQuota,
                'clients' => $clientsStats
            ]
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
            'is_active' => 'required|boolean',
            'force' => 'nullable|boolean'
        ]);

        $user = Auth::user();
        $eventIds = $validated['event_ids'];
        $isActive = $validated['is_active'];
        $force = $validated['force'] ?? false;

        // Si on active les événements, vérifier le quota SMS
        if ($isActive) {
            $requiredSms = $this->calculateRequiredSms($eventIds);
            $smsQuota = $this->getSmsQuota($user);

            if ($requiredSms > $smsQuota['available'] && !$force) {
                return response()->json([
                    'status' => 'quota_warning',
                    'message' => 'Quota SMS insuffisant',
                    'required_sms' => $requiredSms,
                    'available_sms' => $smsQuota['available']
                ], 200);
            }
        }

        // Mettre à jour les configurations d'événements
        $updated = 0;
        foreach ($eventIds as $eventId) {
            $config = UserEventConfig::firstOrNew([
                'user_id' => $user->id,
                'event_type_id' => $eventId
            ]);

            $config->is_active = $isActive;
            $config->save();
            $updated++;
        }

        return response()->json([
            'status' => 'success',
            'message' => "$updated événements ont été " . ($isActive ? 'activés' : 'désactivés'),
            'updated_count' => $updated
        ]);
    }

    /**
     * Récupérer tous les événements du calendrier (dates fixes)
     */
    private function getCalendarEvents()
    {
        // Récupérer tous les événements à date fixe
        return CalendarEvent::where('is_active', true)
            ->orderBy('month')
            ->orderBy('day')
            ->get()
            ->map(function ($event) {
                // Trouver le type d'événement correspondant
                $eventType = EventType::where('code', $event->code)->first();

                // Déterminer la date pour l'année en cours
                $date = Carbon::createFromDate(date('Y'), $event->month, $event->day);

                // Si la date est déjà passée pour cette année, utiliser la date de l'année prochaine
                if ($date->isPast()) {
                    $date = Carbon::createFromDate(date('Y') + 1, $event->month, $event->day);
                }

                return [
                    'id' => $eventType ? $eventType->id : null,
                    'calendar_event_id' => $event->id,
                    'code' => $event->code,
                    'name' => $event->name,
                    'description' => $event->description,
                    'category' => $event->category,
                    'date' => $date->format('Y-m-d'),
                    'event_type' => 'fixed_date',
                    'audience_size' => $eventType ? $this->estimateAudienceSize($eventType) : 0
                ];
            })
            ->filter(function ($event) {
                // Ne garder que les événements qui ont un type d'événement associé
                return $event['id'] !== null;
            });
    }

    /**
     * Récupérer les événements personnels (anniversaires, etc.)
     */
    private function getPersonalEvents($user)
    {
        $events = [];
        $currentYear = date('Y');

        // Trouver le type d'événement pour les anniversaires
        $birthdayEventType = EventType::where('code', 'client_birthday')->first();

        if ($birthdayEventType) {
            // Récupérer tous les clients avec date d'anniversaire
            $clientsWithBirthday = $user->clients()->whereNotNull('birthday')->get();

            foreach ($clientsWithBirthday as $client) {
                // Créer une date d'anniversaire pour l'année en cours
                $birthdayThisYear = Carbon::createFromFormat('Y-m-d', $client->birthday->format('Y-m-d'))
                    ->setYear($currentYear);

                // Si la date est déjà passée pour cette année, utiliser la date de l'année prochaine
                if ($birthdayThisYear->isPast()) {
                    $birthdayThisYear->addYear();
                }

                $events[] = [
                    'id' => $birthdayEventType->id,
                    'client_id' => $client->id,
                    'code' => 'client_birthday',
                    'name' => "Anniversaire de {$client->name}",
                    'description' => "Anniversaire de {$client->name}",
                    'category' => 'personal',
                    'date' => $birthdayThisYear->format('Y-m-d'),
                    'event_type' => 'client_field',
                    'audience_size' => 1 // Un anniversaire concerne un seul client
                ];
            }
        }

        return collect($events);
    }

    /**
     * Combiner tous les événements et préparer les données pour le calendrier
     */
    private function combineEvents($eventTypes, $userConfigs, $calendarEvents, $personalEvents)
    {
        $allEvents = $calendarEvents->concat($personalEvents);

        // Ajouter les événements qui n'ont pas de date fixe
        foreach ($eventTypes as $eventType) {
            if ($eventType->date_type !== 'fixed_date' && $eventType->date_type !== 'client_field') {
                // Pour les événements sans date précise, on ne les ajoute pas au calendrier pour l'instant
                continue;
            }
        }

        return $allEvents;
    }

    /**
     * Préparer les événements pour l'affichage dans le calendrier
     */
    private function prepareEventsForCalendar($events, $userConfigs)
    {
        return $events->map(function ($event) use ($userConfigs) {
            // Vérifier si l'utilisateur a une configuration pour cet événement
            $userConfig = $userConfigs[$event['id']] ?? null;
            $isActive = $userConfig ? $userConfig->is_active : false;

            // Récupérer le type d'événement
            $eventType = EventType::find($event['id']);

            // Préparer le template de message
            $template = $userConfig && $userConfig->custom_template
                ? $userConfig->custom_template
                : ($eventType ? $eventType->default_template : '');

            // Audience logic
            $audienceLogic = $eventType ? $eventType->audience_logic : 'all';
            $audienceOverride = $userConfig ? $userConfig->audience_override : null;

            return [
                'id' => $event['id'],
                'code' => $event['code'],
                'name' => $event['name'],
                'description' => $event['description'],
                'event_type' => $event['event_type'],
                'date' => $event['date'],
                'is_active' => $isActive,
                'audience_size' => $event['audience_size'],
                'category' => $event['category'],
                'template' => $template,
                'audience_logic' => $audienceLogic,
                'audience_override' => $audienceOverride,
                'client_id' => $event['client_id'] ?? null
            ];
        })->values()->all();
    }

    /**
     * Compter les événements à venir
     */
    private function countUpcomingEvents($events)
    {
        $now = Carbon::now();
        return collect($events)->filter(function ($event) use ($now) {
            if (!isset($event['date'])) return false;
            $eventDate = Carbon::parse($event['date']);
            return $eventDate->isAfter($now);
        })->count();
    }

    /**
     * Obtenir les statistiques sur les clients
     */
    private function getClientsStatistics($user)
    {
        // Nombre total de clients
        $totalClients = $user->clients()->count();

        // Nombre de clients avec date d'anniversaire
        $clientsWithBirthday = $user->clients()->whereNotNull('birthday')->count();

        // Clients par catégorie
        $clientsByCategory = $user->categories()
            ->withCount('clients')
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'count' => $category->clients_count
                ];
            });

        return [
            'total' => $totalClients,
            'with_birthday' => $clientsWithBirthday,
            'categories' => $clientsByCategory
        ];
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
        $eventTypes = EventType::whereIn('id', $eventIds)->get();
        $totalSms = 0;

        foreach ($eventTypes as $eventType) {
            $totalSms += $this->estimateAudienceSize($eventType);
        }

        return $totalSms;
    }

    /**
     * Estimer la taille de l'audience pour un événement
     */
    private function estimateAudienceSize(EventType $eventType)
    {
        $user = Auth::user();
        $totalClients = $user->clients()->count();

        // Si l'événement a une taille d'audience attendue définie
        if ($eventType->expected_audience_size > 0) {
            return $eventType->expected_audience_size;
        }

        // Sinon, estimer en fonction du type d'événement
        switch ($eventType->audience_logic) {
            case 'all':
                return $totalClients;

            case 'male':
            case 'female':
                // Estimation simplifiée: 50% des clients
                return ceil($totalClients / 2);

            case 'specific_category':
                // Vérifier le paramètre de catégorie
                $audienceParams = $eventType->audience_parameters;
                if (isset($audienceParams['category_id'])) {
                    return $user->clients()
                        ->where('category_id', $audienceParams['category_id'])
                        ->count();
                }
                return ceil($totalClients / 5); // Estimation par défaut

            case 'specific_tags':
                // Vérifier les tags
                $audienceParams = $eventType->audience_parameters;
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
                if (strpos($eventType->code, 'birthday') !== false) {
                    // Estimation: environ 1/365 des clients ont leur anniversaire un jour donné
                    return max(1, ceil($totalClients / 365));
                }

                // Par défaut, on considère 10% des clients
                return ceil($totalClients / 10);
        }
    }

    /**
     * Mettre à jour une configuration d'événement spécifique
     */
    public function updateEventConfig(Request $request, $id)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'custom_template' => 'nullable|string',
            'audience_override' => 'nullable|array',
            'days_before' => 'nullable|integer|min:0'
        ]);

        $user = Auth::user();
        $eventType = EventType::findOrFail($id);

        // Si l'événement est activé et n'était pas actif avant, vérifier le quota SMS
        $userConfig = UserEventConfig::where('user_id', $user->id)
            ->where('event_type_id', $id)
            ->first();

        $wasActive = $userConfig ? $userConfig->is_active : false;

        if (isset($validated['is_active']) && $validated['is_active'] && !$wasActive) {
            $requiredSms = $this->estimateAudienceSize($eventType);
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

        // Mettre à jour ou créer la configuration
        $config = $this->eventManager->updateUserEventConfig($user, $eventType->id, $validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Configuration mise à jour avec succès',
            'config' => $config
        ]);
    }

    /**
     * Obtenir les détails d'un événement spécifique
     */
    public function getEventDetails($id)
    {
        $user = Auth::user();
        $eventType = EventType::findOrFail($id);

        // Obtenir la configuration utilisateur pour cet événement
        $userConfig = UserEventConfig::where('user_id', $user->id)
            ->where('event_type_id', $id)
            ->first();

        // Estimer la taille de l'audience
        $audienceSize = $this->estimateAudienceSize($eventType);

        // Vérifier si l'utilisateur a assez de SMS
        $smsQuota = $this->getSmsQuota($user);
        $canActivate = $audienceSize <= $smsQuota['available'];

        return response()->json([
            'event' => [
                'id' => $eventType->id,
                'code' => $eventType->code,
                'name' => $eventType->name,
                'description' => $eventType->description,
                'category' => $eventType->category,
                'event_type' => $eventType->date_type,
                'is_active' => $userConfig ? $userConfig->is_active : false,
                'custom_template' => $userConfig ? $userConfig->custom_template : null,
                'default_template' => $eventType->default_template,
                'audience_logic' => $eventType->audience_logic,
                'audience_override' => $userConfig ? $userConfig->audience_override : null,
                'audience_size' => $audienceSize,
                'days_before' => $userConfig ? $userConfig->days_before : 0,
            ],
            'can_activate' => $canActivate,
            'sms_required' => $audienceSize,
            'sms_available' => $smsQuota['available']
        ]);
    }
}
