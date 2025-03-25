<?php

namespace App\Http\Controllers;

use App\Models\EventType;
use App\Models\UserEventConfig;
use App\Services\EventManagerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AutomaticEventsController extends Controller
{
    protected $eventManager;
    
    public function __construct(EventManagerService $eventManager)
    {
        $this->eventManager = $eventManager;
    }
    
    /**
     * Afficher la liste des événements automatiques disponibles
     */
    public function index()
    {
        $user = Auth::user();
        
        // Obtenir tous les types d'événements actifs
        $eventTypes = EventType::where('is_active', true)
                             ->orderBy('category')
                             ->orderBy('name')
                             ->get();
        
        // Obtenir les configurations de l'utilisateur pour ces événements
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
        
        return Inertia::render('AutomaticEvents/Index', [
            'eventCategories' => $eventCategories
        ]);
    }
    
    /**
     * Mettre à jour la configuration d'un événement
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'custom_template' => 'nullable|string',
            'days_before' => 'nullable|integer|min:0',
            'audience_override' => 'nullable|array'
        ]);
        
        $user = Auth::user();
        $eventType = EventType::findOrFail($id);
        
        $config = $this->eventManager->updateUserEventConfig($user, $eventType->id, $validated);
        
        return redirect()->back()->with('success', 'Configuration de l\'événement mise à jour avec succès.');
    }
    
    /**
     * Créer des configurations par défaut pour tous les événements
     */
    public function createAllDefaultConfigs()
    {
        $user = Auth::user();
        $count = $this->eventManager->createDefaultConfigsForUser($user);
        
        return redirect()->back()->with('success', "$count événements ont été configurés avec les paramètres par défaut.");
    }
    
    /**
     * Tester un événement spécifique en envoyant un message immédiatement
     */
    public function testEvent(Request $request, $id)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id'
        ]);
        
        $user = Auth::user();
        $eventType = EventType::findOrFail($id);
        $client = $user->clients()->findOrFail($validated['client_id']);
        
        // Obtenir la configuration de l'utilisateur pour cet événement
        $config = UserEventConfig::firstOrNew([
            'user_id' => $user->id,
            'event_type_id' => $eventType->id
        ]);
        
        // Créer un message de test
        try {
            $messageTemplate = $config->custom_template ?: $eventType->default_template;
            
            // Remplacer les variables
            $content = str_replace('{{client.name}}', $client->name, $messageTemplate);
            $content = str_replace('{{user.name}}', $user->name, $content);
            $content = str_replace('{{year}}', now()->format('Y'), $content);
            
            // Créer le message
            $message = $user->messages()->create([
                'client_id' => $client->id,
                'content' => $content,
                'type' => 'automatic',
                'status' => 'sent',
                'sent_at' => now()
            ]);
            
            return redirect()->back()->with('success', 'Message de test envoyé avec succès.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Erreur lors de l\'envoi du message de test: ' . $e->getMessage());
        }
    }
} 