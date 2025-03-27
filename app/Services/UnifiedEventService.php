<?php

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\EventType;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class UnifiedEventService
{
    protected $eventManager;
    protected $calendarService;
    
    /**
     * Constructor
     */
    public function __construct(
        EventManagerService $eventManager,
        CalendarEventService $calendarService
    ) {
        $this->eventManager = $eventManager;
        $this->calendarService = $calendarService;
    }
    
    /**
     * Traiter tous les événements en une seule opération
     * 
     * @return array Nombre d'événements traités par type
     */
    public function processAllEvents(): array
    {
        $results = [
            'calendar' => 0,
            'client_field' => 0,
            'dynamic' => 0,
            'total' => 0
        ];
        
        // 1. D'abord traiter les événements de calendrier (date fixe)
        $calendarEvents = $this->calendarService->getEventsForDate(now());
        
        foreach ($calendarEvents as $calendarEvent) {
            $processedCount = $this->processCalendarEvent($calendarEvent);
            $results['calendar'] += $processedCount;
            $results['total'] += $processedCount;
        }
        
        // 2. Traiter les événements basés sur des champs client (anniversaires, etc.)
        $clientFieldCount = $this->eventManager->processClientFieldEvents();
        $results['client_field'] = $clientFieldCount;
        $results['total'] += $clientFieldCount;
        
        // 3. Traiter les événements à date dynamique
        $dynamicCount = $this->eventManager->processDynamicDateEvents();
        $results['dynamic'] = $dynamicCount;
        $results['total'] += $dynamicCount;
        
        Log::info("Traitement unifié des événements terminé", [
            'calendar_events' => $results['calendar'],
            'client_field_events' => $results['client_field'],
            'dynamic_events' => $results['dynamic'],
            'total' => $results['total']
        ]);
        
        return $results;
    }
    
    /**
     * Traiter un événement de calendrier spécifique
     * 
     * @param CalendarEvent $calendarEvent
     * @return int Nombre de messages envoyés
     */
    protected function processCalendarEvent(CalendarEvent $calendarEvent): int
    {
        try {
            // Récupérer les configurations des utilisateurs pour ce type d'événement
            $eventType = EventType::where('code', 'calendar_event')
                ->where('is_active', true)
                ->first();
                
            if (!$eventType) {
                return 0;
            }
            
            // Créer un contexte d'événement avec les données du calendrier
            $eventContext = [
                'name' => $calendarEvent->name,
                'date' => Carbon::parse($calendarEvent->event_date)->format('Y-m-d'),
                'description' => $calendarEvent->description,
                'calendar_event_id' => $calendarEvent->id
            ];
            
            return $this->eventManager->processEventWithContext($eventType, $eventContext);
        } catch (\Exception $e) {
            Log::error("Erreur lors du traitement de l'événement de calendrier", [
                'calendar_event_id' => $calendarEvent->id,
                'error' => $e->getMessage()
            ]);
            
            return 0;
        }
    }
    
    /**
     * Prévisualiser les événements à venir pour l'utilisateur
     * 
     * @param \App\Models\User $user Utilisateur
     * @param int $days Nombre de jours à prévisualiser
     * @return array Événements à venir
     */
    public function previewUpcomingEvents($user, int $days = 7): array
    {
        $upcomingEvents = [];
        $endDate = now()->addDays($days);
        
        // 1. Récupérer les événements de calendrier
        $calendarEvents = $this->calendarService->getEventsForDateRange(now(), $endDate);
        
        foreach ($calendarEvents as $event) {
            $upcomingEvents[] = [
                'type' => 'calendar',
                'name' => $event->name,
                'date' => $event->event_date,
                'description' => $event->description,
                'estimated_audience' => $this->estimateAudience($user, 'calendar', $event->id)
            ];
        }
        
        // 2. Récupérer les événements de champ client (approximation)
        $clientFieldEvents = $this->previewClientFieldEvents($user, $days);
        $upcomingEvents = array_merge($upcomingEvents, $clientFieldEvents);
        
        // 3. Récupérer les événements dynamiques
        $dynamicEvents = $this->previewDynamicEvents($user, $days);
        $upcomingEvents = array_merge($upcomingEvents, $dynamicEvents);
        
        // Trier par date
        usort($upcomingEvents, function($a, $b) {
            return strtotime($a['date']) - strtotime($b['date']);
        });
        
        return $upcomingEvents;
    }
    
    /**
     * Prévisualiser les événements basés sur les champs client
     */
    protected function previewClientFieldEvents($user, int $days): array
    {
        // Logique de prévisualisation pour les événements de champ client
        // À implémenter selon les besoins spécifiques
        
        return [];
    }
    
    /**
     * Prévisualiser les événements dynamiques
     */
    protected function previewDynamicEvents($user, int $days): array
    {
        // Logique de prévisualisation pour les événements dynamiques
        // À implémenter selon les besoins spécifiques
        
        return [];
    }
    
    /**
     * Estimer l'audience pour un événement
     */
    protected function estimateAudience($user, string $eventType, $eventId): int
    {
        // Logique d'estimation d'audience
        // À implémenter selon les besoins spécifiques
        
        return 0;
    }
} 