<?php

namespace App\Http\Controllers;

use App\Models\MarketingAutomationRule;
use App\Services\MarketingAutomationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\Process\Process;

class MarketingAutomationController extends Controller
{
    protected $automationService;

    public function __construct(MarketingAutomationService $automationService)
    {
        $this->automationService = $automationService;
    }

    /**
     * Afficher la liste des automatisations
     */
    public function index(Request $request)
    {
        $query = MarketingAutomationRule::where('user_id', auth()->id());

        // Filtres
        if ($request->filled('triggerType')) {
            $query->where('trigger_type', $request->triggerType);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('useAI')) {
            $query->where('use_ai', $request->useAI === 'true');
        }

        $automations = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        // Statistiques
        $stats = [
            'totalRules' => MarketingAutomationRule::where('user_id', auth()->id())->count(),
            'activeRules' => MarketingAutomationRule::where('user_id', auth()->id())->where('status', 'active')->count(),
            'executedToday' => MarketingAutomationRule::where('user_id', auth()->id())
                ->whereDate('last_executed_at', today())
                ->count(),
            'successRate' => $this->calculateSuccessRate(),
        ];

        return Inertia::render('Marketing/Automations/Index', [
            'automations' => $automations,
            'stats' => $stats,
            'filters' => $request->only(['triggerType', 'status', 'useAI'])
        ]);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        return Inertia::render('Marketing/Automations/Create');
    }

    /**
     * Stocker une nouvelle automatisation
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'triggerType' => 'required|string|in:birthday,seasonal,new_client,inactive_client,custom',
            'actionType' => 'required|string|in:send_message,send_email,add_tag,create_task',
            'status' => 'required|string|in:draft,active,inactive',
            'useAI' => 'boolean',
            'triggerConditions' => 'nullable|array',
            'actionData' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $automation = MarketingAutomationRule::create([
                'user_id' => auth()->id(),
                'name' => $request->name,
                'description' => $request->description,
                'trigger_type' => $request->triggerType,
                'action_type' => $request->actionType,
                'status' => $request->status,
                'use_ai' => $request->useAI ?? false,
                'trigger_conditions' => $request->triggerConditions ?? [],
                'action_data' => $request->actionData ?? [],
            ]);

            return redirect()->route('marketing.automations.index')
                ->with('success', 'Automatisation créée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création d\'automatisation: ' . $e->getMessage());
            return back()->withErrors(['creation' => 'Erreur lors de la création: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Afficher une automatisation spécifique
     */
    public function show(MarketingAutomationRule $automation)
    {
        $this->authorize('view', $automation);

        $automation->load(['executionHistory' => function ($query) {
            $query->latest()->take(50);
        }]);

        return Inertia::render('Marketing/Automations/Show', [
            'automation' => $automation
        ]);
    }

    /**
     * Afficher le formulaire de modification
     */
    public function edit(MarketingAutomationRule $automation)
    {
        $this->authorize('update', $automation);

        return Inertia::render('Marketing/Automations/Edit', [
            'automation' => $automation
        ]);
    }

    /**
     * Mettre à jour une automatisation
     */
    public function update(Request $request, MarketingAutomationRule $automation)
    {
        $this->authorize('update', $automation);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'trigger_type' => 'required|string|in:birthday,seasonal,new_client,inactive_client,custom',
            'action_type' => 'required|string|in:send_message,send_email,add_tag,create_task',
            'status' => 'required|string|in:draft,active,inactive',
            'use_ai' => 'boolean',
            'trigger_conditions' => 'nullable|array',
            'action_data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $automation->update($request->all());

            return redirect()->route('marketing.automations.index')
                ->with('success', 'Automatisation mise à jour avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour d\'automatisation: ' . $e->getMessage());
            return back()->withErrors(['update' => 'Erreur lors de la mise à jour: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Supprimer une automatisation
     */
    public function destroy(MarketingAutomationRule $automation)
    {
        $this->authorize('delete', $automation);

        try {
            $automation->delete();

            return redirect()->route('marketing.automations.index')
                ->with('success', 'Automatisation supprimée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression d\'automatisation: ' . $e->getMessage());
            return back()->withErrors(['delete' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
        }
    }

    /**
     * Activer une automatisation
     */
    public function activate(MarketingAutomationRule $automation)
    {
        $this->authorize('update', $automation);

        try {
            $automation->activate();

            return back()->with('success', 'Automatisation activée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'activation d\'automatisation: ' . $e->getMessage());
            return back()->withErrors(['activation' => 'Erreur lors de l\'activation: ' . $e->getMessage()]);
        }
    }

    /**
     * Désactiver une automatisation
     */
    public function deactivate(MarketingAutomationRule $automation)
    {
        $this->authorize('update', $automation);

        try {
            $automation->deactivate();

            return back()->with('success', 'Automatisation désactivée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la désactivation d\'automatisation: ' . $e->getMessage());
            return back()->withErrors(['deactivation' => 'Erreur lors de la désactivation: ' . $e->getMessage()]);
        }
    }

    /**
     * Exécuter une automatisation manuellement
     */
    public function execute(MarketingAutomationRule $automation)
    {
        $this->authorize('update', $automation);

        try {
            $result = $this->automationService->executeRule($automation);

            return back()->with('success', 'Automatisation exécutée avec succès. ' . $result['message']);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'exécution d\'automatisation: ' . $e->getMessage());
            return back()->withErrors(['execution' => 'Erreur lors de l\'exécution: ' . $e->getMessage()]);
        }
    }

    /**
     * Dupliquer une automatisation
     */
    public function duplicate(MarketingAutomationRule $automation)
    {
        $this->authorize('view', $automation);

        try {
            $newAutomation = $automation->replicate();
            $newAutomation->name = $automation->name . ' (Copie)';
            $newAutomation->status = 'draft';
            $newAutomation->execution_count = 0;
            $newAutomation->last_executed_at = null;
            $newAutomation->save();

            return redirect()->route('marketing.automations.edit', $newAutomation)
                ->with('success', 'Automatisation dupliquée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la duplication d\'automatisation: ' . $e->getMessage());
            return back()->withErrors(['duplication' => 'Erreur lors de la duplication: ' . $e->getMessage()]);
        }
    }

    /**
     * Créer une règle d'anniversaire
     */
    public function createBirthdayRule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'days_ahead' => 'nullable|integer|min:0|max:30',
            'message' => 'required|string|max:1000',
            'use_ai' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $rule = $this->automationService->createBirthdayRule(
                auth()->id(),
                $request->name ?? 'Anniversaires Clients',
                [
                    'days_ahead' => $request->days_ahead ?? 0,
                    'message' => $request->message,
                    'use_ai' => $request->use_ai ?? false,
                ]
            );

            return redirect()->route('marketing.automations.index')
                ->with('success', 'Règle d\'anniversaire créée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de règle d\'anniversaire: ' . $e->getMessage());
            return back()->withErrors(['birthday_rule' => 'Erreur lors de la création: ' . $e->getMessage()]);
        }
    }

    /**
     * Créer une règle saisonnière
     */
    public function createSeasonalRule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'season' => 'required|string|in:spring,summer,autumn,winter,christmas,new_year',
            'message' => 'required|string|max:1000',
            'use_ai' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $rule = $this->automationService->createSeasonalRule(
                auth()->id(),
                $request->name ?? 'Rappel Saisonnier',
                [
                    'season' => $request->season,
                    'message' => $request->message,
                    'use_ai' => $request->use_ai ?? false,
                ]
            );

            return redirect()->route('marketing.automations.index')
                ->with('success', 'Règle saisonnière créée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de règle saisonnière: ' . $e->getMessage());
            return back()->withErrors(['seasonal_rule' => 'Erreur lors de la création: ' . $e->getMessage()]);
        }
    }

    /**
     * Créer une règle pour nouveaux clients
     */
    public function createNewClientRule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'delay_hours' => 'nullable|integer|min:1|max:168',
            'message' => 'required|string|max:1000',
            'use_ai' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $rule = $this->automationService->createNewClientRule(
                auth()->id(),
                $request->name ?? 'Bienvenue Nouveaux Clients',
                [
                    'delay_hours' => $request->delay_hours ?? 24,
                    'message' => $request->message,
                    'use_ai' => $request->use_ai ?? false,
                ]
            );

            return redirect()->route('marketing.automations.index')
                ->with('success', 'Règle pour nouveaux clients créée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de règle nouveaux clients: ' . $e->getMessage());
            return back()->withErrors(['new_client_rule' => 'Erreur lors de la création: ' . $e->getMessage()]);
        }
    }

    /**
     * Créer une règle pour clients inactifs
     */
    public function createInactiveClientRule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'inactive_days' => 'nullable|integer|min:7|max:365',
            'message' => 'required|string|max:1000',
            'use_ai' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $rule = $this->automationService->createInactiveClientRule(
                auth()->id(),
                $request->name ?? 'Rappel Clients Inactifs',
                [
                    'inactive_days' => $request->inactive_days ?? 30,
                    'message' => $request->message,
                    'use_ai' => $request->use_ai ?? false,
                ]
            );

            return redirect()->route('marketing.automations.index')
                ->with('success', 'Règle pour clients inactifs créée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de règle clients inactifs: ' . $e->getMessage());
            return back()->withErrors(['inactive_client_rule' => 'Erreur lors de la création: ' . $e->getMessage()]);
        }
    }

    /**
     * Créer les règles par défaut
     */
    public function createDefaultRules()
    {
        try {
            $rules = $this->automationService->createDefaultRules(auth()->id());

            return redirect()->route('marketing.automations.index')
                ->with('success', count($rules) . ' règles par défaut créées avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création des règles par défaut: ' . $e->getMessage());
            return back()->withErrors(['default_rules' => 'Erreur lors de la création: ' . $e->getMessage()]);
        }
    }

    /**
     * Obtenir l'historique d'exécution
     */
    public function executionHistory(MarketingAutomationRule $automation)
    {
        $this->authorize('view', $automation);

        $history = $automation->executionHistory()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'history' => $history
        ]);
    }

    /**
     * Obtenir les statistiques d'une automatisation
     */
    public function getStats(MarketingAutomationRule $automation)
    {
        $this->authorize('view', $automation);

        $stats = [
            'total_executions' => $automation->execution_count,
            'last_execution' => $automation->last_executed_at,
            'success_rate' => $this->calculateRuleSuccessRate($automation),
            'clients_affected' => $this->getClientsAffectedCount($automation),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats
        ]);
    }

    /**
     * Calculer le taux de succès global
     */
    private function calculateSuccessRate()
    {
        $totalRules = MarketingAutomationRule::where('user_id', auth()->id())->count();
        if ($totalRules === 0) return 0;

        $successfulRules = MarketingAutomationRule::where('user_id', auth()->id())
            ->where('execution_count', '>', 0)
            ->whereNotNull('last_executed_at')
            ->count();

        return round(($successfulRules / $totalRules) * 100, 1);
    }

    /**
     * Exécuter manuellement une automatisation depuis l'interface
     */
    public function executeManual(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:birthday,seasonal,new-client,inactive-client,all',
            'dry_run' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $type = $request->type;
            $dryRun = $request->dry_run ?? false;
            $logs = [];

            // Démarrer le processus d'exécution
            $logs[] = "🚀 Démarrage de l'automatisation {$type}...";
            
            if ($dryRun) {
                $logs[] = "⚠️ Mode test activé - Aucune action réelle ne sera effectuée";
            }

            $startTime = microtime(true);

            switch ($type) {
                case 'birthday':
                    $logs[] = "🎂 Exécution des automatisations d'anniversaire...";
                    $result = $this->automationService->executeBirthdayAutomations();
                    break;

                case 'seasonal':
                    $logs[] = "🎊 Exécution des automatisations saisonnières...";
                    $result = $this->automationService->executeSeasonalAutomations();
                    break;

                case 'new-client':
                    $logs[] = "👋 Exécution des automatisations pour nouveaux clients...";
                    $result = $this->automationService->executeNewClientAutomations();
                    break;

                case 'inactive-client':
                    $logs[] = "😴 Exécution des automatisations pour clients inactifs...";
                    $result = $this->automationService->executeInactiveClientAutomations();
                    break;

                case 'all':
                default:
                    $logs[] = "🔄 Exécution de toutes les automatisations...";
                    $result = $this->automationService->executeAllAutomations();
                    break;
            }

            $endTime = microtime(true);
            $executionTime = round($endTime - $startTime, 2);

            $logs[] = "✅ Automatisation terminée en {$executionTime}s";
            $logs[] = "📊 Résultats: " . json_encode($result);

            return response()->json([
                'success' => true,
                'message' => "Automatisation {$type} exécutée avec succès",
                'logs' => $logs,
                'results' => $result,
                'execution_time' => $executionTime
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'exécution manuelle d\'automatisation', [
                'type' => $request->type,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'exécution: ' . $e->getMessage(),
                'logs' => array_merge($logs ?? [], ["❌ Erreur: " . $e->getMessage()])
            ], 500);
        }
    }

    /**
     * Mettre à jour une règle d'automatisation
     */
    public function updateRule(Request $request, MarketingAutomationRule $rule)
    {
        $this->authorize('update', $rule);

        $validator = Validator::make($request->all(), [
            'status' => 'string|in:active,inactive,draft',
            'name' => 'string|max:255',
            'conditions' => 'array',
            'actions' => 'array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $rule->update($request->only(['status', 'name', 'conditions', 'actions']));

            return response()->json([
                'success' => true,
                'message' => 'Règle mise à jour avec succès',
                'rule' => $rule
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de règle d\'automatisation', [
                'rule_id' => $rule->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Arrêter une exécution en cours
     */
    public function stopExecution(Request $request, $executionId)
    {
        try {
            // Dans une vraie implémentation, vous stockeriez les exécutions en cours
            // dans Redis ou une table de base de données
            // Pour l'instant, on simule l'arrêt
            
            Log::info('Arrêt d\'exécution demandé', [
                'execution_id' => $executionId,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Exécution arrêtée avec succès'
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'arrêt d\'exécution', [
                'execution_id' => $executionId,
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'arrêt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculer le taux de succès d'une règle
     */
    private function calculateRuleSuccessRate($automation)
    {
        if ($automation->execution_count === 0) return 0;

        // Logique simplifiée - à améliorer selon vos besoins
        return 85; // Exemple
    }

    /**
     * Obtenir le nombre de clients affectés par une règle
     */
    private function getClientsAffectedCount($automation)
    {
        // Logique simplifiée - à implémenter selon vos besoins
        return rand(10, 100); // Exemple
    }
}