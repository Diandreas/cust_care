<?php

namespace App\Services;

use App\Models\EventType;
use App\Models\UserEventConfig;
use App\Models\User;
use App\Models\Client;
use App\Models\Message;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class EventManagerService
{
    protected $usageTracker;
    
    public function __construct(UsageTrackingService $usageTracker)
    {
        $this->usageTracker = $usageTracker;
    }
    
    /**
     * Créer des configurations d'événements par défaut pour un nouvel utilisateur
     */
    public function createDefaultConfigsForUser(User $user)
    {
        // Obtenir tous les types d'événements actifs
        $eventTypes = EventType::where('is_active', true)->get();
        
        foreach ($eventTypes as $eventType) {
            // Créer une configuration avec les valeurs par défaut
            UserEventConfig::create([
                'user_id' => $user->id,
                'event_type_id' => $eventType->id,
                'is_active' => true,
                'days_before' => 0,
            ]);
        }
        
        return $eventTypes->count();
    }
    
    /**
     * Traiter tous les événements applicables aujourd'hui
     */
    public function processAllEvents()
    {
        $this->processFixedDateEvents();
        $this->processClientFieldEvents();
        $this->processDynamicDateEvents();
        
        return true;
    }
    
    /**
     * Traiter les événements à date fixe (jours fériés, fêtes nationales, etc.)
     */
    protected function processFixedDateEvents()
    {
        Log::info('Traitement des événements à date fixe...');
        
        // Ajouter un verrou global pour éviter les exécutions parallèles
        $lockKey = 'processing_fixed_date_events_' . date('Y-m-d');
        if (Cache::has($lockKey)) {
            Log::info('Événements à date fixe déjà en cours de traitement');
            return 0;
        }
        
        Cache::put($lockKey, true, 60); // Verrou d'une heure
        
        try {
            // Obtenir tous les types d'événements à date fixe
            $eventTypes = EventType::where('date_type', 'fixed_date')
                                  ->where('is_active', true)
                                  ->get();
            
            $count = 0;
            
            foreach ($eventTypes as $eventType) {
                // Vérifier si l'événement est applicable aujourd'hui
                if (!$eventType->isApplicableToday()) {
                    continue;
                }
                
                // Obtenir toutes les configurations utilisateur pour ce type d'événement
                $userConfigs = UserEventConfig::where('event_type_id', $eventType->id)
                                            ->where('is_active', true)
                                            ->where(function($query) {
                                                $query->whereNull('last_processed_at')
                                                      ->orWhere('last_processed_at', '<', today());
                                            })
                                            ->with('user')
                                            ->get();
                
                foreach ($userConfigs as $config) {
                    // Traiter l'événement pour cet utilisateur
                    $messagesCount = $this->processEventForUser($config);
                    $count += $messagesCount;
                    
                    // Marquer comme traité
                    if ($messagesCount > 0) {
                        $config->markAsProcessed();
                    }
                }
            }
            
            Log::info("$count messages envoyés pour des événements à date fixe.");
            return $count;
        } finally {
            Cache::forget($lockKey);
        }
    }
    
    /**
     * Traiter les événements basés sur des champs client (anniversaire, fête du prénom)
     */
    protected function processClientFieldEvents()
    {
        Log::info('Traitement des événements basés sur des champs client...');
        
        // Ajouter un verrou global pour éviter les exécutions parallèles
        $lockKey = 'processing_client_field_events_' . date('Y-m-d');
        if (Cache::has($lockKey)) {
            Log::info('Événements basés sur des champs client déjà en cours de traitement');
            return 0;
        }
        
        Cache::put($lockKey, true, 60); // Verrou d'une heure
        
        try {
            // Obtenir tous les types d'événements basés sur des champs client
            $eventTypes = EventType::where('date_type', 'client_field')
                                  ->where('is_active', true)
                                  ->get();
            
            $count = 0;
            
            foreach ($eventTypes as $eventType) {
                $field = $eventType->getClientField();
                
                if (!$field) {
                    continue;
                }
                
                // Obtenir toutes les configurations utilisateur pour ce type d'événement
                $userConfigs = UserEventConfig::where('event_type_id', $eventType->id)
                                            ->where('is_active', true)
                                            ->where(function($query) {
                                                $query->whereNull('last_processed_at')
                                                      ->orWhere('last_processed_at', '<', today());
                                            })
                                            ->with('user')
                                            ->get();
                
                foreach ($userConfigs as $config) {
                    // Trouver les clients correspondant à la condition du champ
                    $messagesCount = $this->processClientFieldEventForUser($config, $field);
                    $count += $messagesCount;
                    
                    // Marquer comme traité
                    if ($messagesCount > 0) {
                        $config->markAsProcessed();
                    }
                }
            }
            
            Log::info("$count messages envoyés pour des événements basés sur des champs client.");
            return $count;
        } finally {
            Cache::forget($lockKey);
        }
    }
    
    /**
     * Traiter les événements à date dynamique (X jours avant une autre date)
     */
    protected function processDynamicDateEvents()
    {
        Log::info('Traitement des événements à date dynamique...');
        
        // Obtenir tous les types d'événements à date dynamique
        $eventTypes = EventType::where('date_type', 'dynamic_date')
                              ->where('is_active', true)
                              ->get();
        
        $count = 0;
        
        foreach ($eventTypes as $eventType) {
            // Obtenir les paramètres de date
            $baseEvent = $eventType->date_parameters['base_event'] ?? null;
            $daysBefore = $eventType->date_parameters['days_before'] ?? 0;
            
            if (!$baseEvent) {
                continue;
            }
            
            // Calculer la date cible pour aujourd'hui
            $baseEventType = EventType::where('code', $baseEvent)->first();
            
            if (!$baseEventType || !$baseEventType->date_parameters) {
                continue;
            }
            
            $baseMonth = $baseEventType->date_parameters['month'] ?? null;
            $baseDay = $baseEventType->date_parameters['day'] ?? null;
            
            if (!$baseMonth || !$baseDay) {
                continue;
            }
            
            // Créer la date de l'événement de base
            $now = Carbon::now();
            $baseDate = Carbon::create($now->year, $baseMonth, $baseDay);
            
            // Si la date est passée, utiliser l'année prochaine
            if ($baseDate->isPast()) {
                $baseDate->addYear();
            }
            
            // Calculer la date à laquelle nous devrions envoyer une notification
            $targetDate = (clone $baseDate)->subDays($daysBefore);
            
            // Vérifier si aujourd'hui est le jour cible
            if (!$now->isSameDay($targetDate)) {
                continue;
            }
            
            // Obtenir toutes les configurations utilisateur pour ce type d'événement
            $userConfigs = UserEventConfig::where('event_type_id', $eventType->id)
                                        ->where('is_active', true)
                                        ->with('user')
                                        ->get();
            
            foreach ($userConfigs as $config) {
                // Vérifier si cet événement n'a pas déjà été traité récemment
                if ($config->last_processed_at && $config->last_processed_at->isToday()) {
                    continue;
                }
                
                // Traiter l'événement
                $messagesCount = $this->processEventForUser($config);
                $count += $messagesCount;
                
                // Marquer comme traité
                if ($messagesCount > 0) {
                    $config->markAsProcessed();
                }
            }
        }
        
        Log::info("$count messages envoyés pour des événements à date dynamique.");
        return $count;
    }
    
    /**
     * Traiter un événement pour un utilisateur
     */
    protected function processEventForUser(UserEventConfig $config)
    {
        $user = $config->user;
        $eventType = $config->eventType;
        
        if (!$user || !$eventType) {
            return 0;
        }
        
        // Obtenir les clients cibles selon la logique d'audience
        $clients = $this->getTargetClientsForEvent($user, $config);
        
        if ($clients->isEmpty()) {
            return 0;
        }
        
        // Vérifier si l'utilisateur peut envoyer des SMS à tous ces clients
        $totalClients = $clients->count();
        if (!$this->usageTracker->canSendSms($user, $totalClients)) {
            Log::warning("Quota SMS insuffisant pour l'utilisateur {$user->id}");
            return 0;
        }
        
        // Envoyer les messages
        $sentCount = 0;
        $template = $config->getMessageTemplate();
        
        foreach ($clients as $client) {
            try {
                // Traiter le contenu du message (remplacer les variables)
                $content = $this->processMessageContent($template, $client, $user);
                
                // Créer et envoyer le message
                Message::create([
                    'user_id' => $user->id,
                    'client_id' => $client->id,
                    'content' => $content,
                    'type' => 'automatic',
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);
                
                $sentCount++;
            } catch (\Exception $e) {
                Log::error("Erreur lors de l'envoi du message automatique au client {$client->id}: " . $e->getMessage());
            }
        }
        
        // Suivre l'utilisation des SMS
        if ($sentCount > 0) {
            $this->usageTracker->trackSmsUsage($user, $sentCount);
        }
        
        return $sentCount;
    }
    
    /**
     * Traiter un événement basé sur un champ client
     */
    protected function processClientFieldEventForUser(UserEventConfig $config, string $field)
    {
        $user = $config->user;
        $eventType = $config->eventType;
        
        if (!$user || !$eventType) {
            return 0;
        }
        
        // Trouver les clients dont le champ correspond à aujourd'hui
        $today = now();
        $todayMonth = $today->format('m');
        $todayDay = $today->format('d');
        
        $clients = $user->clients();
        
        // Filtrer selon la logique d'audience
        $clients = $this->applyAudienceFilters($clients, $config);
        
        // Pour les anniversaires
        if ($field === 'birthday') {
            $clients = $clients->whereNotNull('birthday')
                             ->whereRaw("MONTH(birthday) = ?", [$todayMonth])
                             ->whereRaw("DAY(birthday) = ?", [$todayDay])
                             ->get();
        }
        // Pour d'autres champs de date
        else {
            // Implémentation pour d'autres champs si nécessaire
            $clients = collect();
        }
        
        if ($clients->isEmpty()) {
            return 0;
        }
        
        // Vérifier si l'utilisateur peut envoyer des SMS à tous ces clients
        $totalClients = $clients->count();
        if (!$this->usageTracker->canSendSms($user, $totalClients)) {
            Log::warning("Quota SMS insuffisant pour l'utilisateur {$user->id}");
            return 0;
        }
        
        // Envoyer les messages
        $sentCount = 0;
        $template = $config->getMessageTemplate();
        
        foreach ($clients as $client) {
            try {
                // Traiter le contenu du message (remplacer les variables)
                $content = $this->processMessageContent($template, $client, $user);
                
                // Créer et envoyer le message
                Message::create([
                    'user_id' => $user->id,
                    'client_id' => $client->id,
                    'content' => $content,
                    'type' => 'automatic',
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);
                
                $sentCount++;
            } catch (\Exception $e) {
                Log::error("Erreur lors de l'envoi du message automatique au client {$client->id}: " . $e->getMessage());
            }
        }
        
        // Suivre l'utilisation des SMS
        if ($sentCount > 0) {
            $this->usageTracker->trackSmsUsage($user, $sentCount);
        }
        
        return $sentCount;
    }
    
    /**
     * Obtenir les clients cibles pour un événement
     */
    protected function getTargetClientsForEvent(User $user, UserEventConfig $config)
    {
        $query = $user->clients();
        
        // Appliquer les filtres d'audience
        $query = $this->applyAudienceFilters($query, $config);
        
        return $query->get();
    }
    
    /**
     * Appliquer les filtres d'audience à une requête de clients
     */
    protected function applyAudienceFilters($query, UserEventConfig $config)
    {
        $eventType = $config->eventType;
        $audienceLogic = $eventType->audience_logic;
        $audienceParams = $config->getAudienceParameters();
        
        switch ($audienceLogic) {
            case 'male':
                $query->where('gender', 'male');
                break;
                
            case 'female':
                $query->where('gender', 'female');
                break;
                
            case 'specific_tags':
                if (!empty($audienceParams['tags'])) {
                    $query->whereHas('tags', function($q) use ($audienceParams) {
                        $q->whereIn('tags.id', $audienceParams['tags']);
                    });
                }
                break;
                
            case 'specific_category':
                if (!empty($audienceParams['category_id'])) {
                    $query->where('category_id', $audienceParams['category_id']);
                }
                break;
                
            // Pour 'all', aucun filtre n'est nécessaire
            case 'all':
            default:
                break;
        }
        
        return $query;
    }
    
    /**
     * Traiter le contenu du message en remplaçant les variables
     */
    protected function processMessageContent(string $template, Client $client, User $user): string
    {
        $content = $template;
        
        // Remplacer les variables client
        $content = str_replace('{{client.name}}', $client->name, $content);
        $content = str_replace('{{client.phone}}', $client->phone, $content);
        $content = str_replace('{{client.email}}', $client->email ?? '', $content);
        
        // Gérer les dates d'anniversaire si présentes
        if ($client->birthday) {
            $content = str_replace('{{client.birthday}}', $client->birthday->format('d/m/Y'), $content);
            $content = str_replace('{{client.age}}', $client->birthday->age, $content);
        }
        
        // Remplacer les variables utilisateur
        $content = str_replace('{{user.name}}', $user->name, $content);
        $content = str_replace('{{user.business}}', $user->business_name ?? $user->name, $content);
        
        // Remplacer les variables de date
        $content = str_replace('{{year}}', now()->format('Y'), $content);
        $content = str_replace('{{date}}', now()->format('d/m/Y'), $content);
        
        return $content;
    }
    
    /**
     * Créer ou mettre à jour la configuration d'un événement pour un utilisateur
     */
    public function updateUserEventConfig(User $user, int $eventTypeId, array $data)
    {
        $config = UserEventConfig::firstOrNew([
            'user_id' => $user->id,
            'event_type_id' => $eventTypeId
        ]);
        
        $config->fill([
            'is_active' => $data['is_active'] ?? true,
            'custom_template' => $data['custom_template'] ?? null,
            'days_before' => $data['days_before'] ?? 0,
            'audience_override' => $data['audience_override'] ?? null
        ]);
        
        $config->save();
        
        return $config;
    }
} 