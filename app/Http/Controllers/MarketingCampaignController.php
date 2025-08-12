<?php

namespace App\Http\Controllers;

use App\Models\MarketingCampaign;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MarketingCampaignController extends Controller
{
    protected $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Afficher la liste des campagnes
     */
    public function index(Request $request)
    {
        $query = MarketingCampaign::where('user_id', auth()->id())
            ->with(['messages' => function ($query) {
                $query->latest()->take(5);
            }]);

        // Filtres
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $campaigns = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Marketing/Campaigns/Index', [
            'campaigns' => $campaigns,
            'filters' => $request->only(['search', 'type', 'status'])
        ]);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        return Inertia::render('Marketing/Campaigns/Create');
    }

    /**
     * Stocker une nouvelle campagne
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|string|in:newsletter,promotion,announcement,reminder,seasonal',
            'target_audience' => 'nullable|array',
            'content' => 'required|array',
            'scheduled_at' => 'nullable|date|after:now',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $campaign = MarketingCampaign::create([
                'user_id' => auth()->id(),
                'name' => $request->name,
                'description' => $request->description,
                'type' => $request->type,
                'target_audience' => $request->target_audience ?? [],
                'content' => $request->content,
                'scheduled_at' => $request->scheduled_at,
                'settings' => $request->settings ?? [],
                'status' => $request->scheduled_at ? 'scheduled' : 'draft',
            ]);

            return redirect()->route('marketing.campaigns.index')
                ->with('success', 'Campagne créée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la création de campagne: ' . $e->getMessage());
            return back()->withErrors(['creation' => 'Erreur lors de la création: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Afficher une campagne spécifique
     */
    public function show(MarketingCampaign $campaign)
    {
        $this->authorize('view', $campaign);

        $campaign->load(['messages' => function ($query) {
            $query->latest()->paginate(20);
        }]);

        // Calculer les métriques
        $metrics = $this->calculateCampaignMetrics($campaign);

        return Inertia::render('Marketing/Campaigns/Show', [
            'campaign' => $campaign,
            'metrics' => $metrics
        ]);
    }

    /**
     * Afficher le formulaire de modification
     */
    public function edit(MarketingCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        return Inertia::render('Marketing/Campaigns/Edit', [
            'campaign' => $campaign
        ]);
    }

    /**
     * Mettre à jour une campagne
     */
    public function update(Request $request, MarketingCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'type' => 'required|string|in:newsletter,promotion,announcement,reminder,seasonal',
            'target_audience' => 'nullable|array',
            'content' => 'required|array',
            'scheduled_at' => 'nullable|date|after:now',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $campaign->update($request->all());

            return redirect()->route('marketing.campaigns.index')
                ->with('success', 'Campagne mise à jour avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour de campagne: ' . $e->getMessage());
            return back()->withErrors(['update' => 'Erreur lors de la mise à jour: ' . $e->getMessage()])->withInput();
        }
    }

    /**
     * Supprimer une campagne
     */
    public function destroy(MarketingCampaign $campaign)
    {
        $this->authorize('delete', $campaign);

        try {
            $campaign->delete();

            return redirect()->route('marketing.campaigns.index')
                ->with('success', 'Campagne supprimée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression de campagne: ' . $e->getMessage());
            return back()->withErrors(['delete' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
        }
    }

    /**
     * Démarrer une campagne
     */
    public function start(MarketingCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        try {
            if (!$campaign->canStart()) {
                return back()->withErrors(['start' => 'Cette campagne ne peut pas être démarrée.']);
            }

            $campaign->start();

            return back()->with('success', 'Campagne démarrée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors du démarrage de campagne: ' . $e->getMessage());
            return back()->withErrors(['start' => 'Erreur lors du démarrage: ' . $e->getMessage()]);
        }
    }

    /**
     * Mettre en pause une campagne
     */
    public function pause(MarketingCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        try {
            $campaign->pause();

            return back()->with('success', 'Campagne mise en pause avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise en pause de campagne: ' . $e->getMessage());
            return back()->withErrors(['pause' => 'Erreur lors de la mise en pause: ' . $e->getMessage()]);
        }
    }

    /**
     * Reprendre une campagne
     */
    public function resume(MarketingCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        try {
            $campaign->resume();

            return back()->with('success', 'Campagne reprise avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la reprise de campagne: ' . $e->getMessage());
            return back()->withErrors(['resume' => 'Erreur lors de la reprise: ' . $e->getMessage()]);
        }
    }

    /**
     * Terminer une campagne
     */
    public function complete(MarketingCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        try {
            $campaign->complete();

            return back()->with('success', 'Campagne terminée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la finalisation de campagne: ' . $e->getMessage());
            return back()->withErrors(['complete' => 'Erreur lors de la finalisation: ' . $e->getMessage()]);
        }
    }

    /**
     * Annuler une campagne
     */
    public function cancel(MarketingCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        try {
            $campaign->cancel();

            return back()->with('success', 'Campagne annulée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'annulation de campagne: ' . $e->getMessage());
            return back()->withErrors(['cancel' => 'Erreur lors de l\'annulation: ' . $e->getMessage()]);
        }
    }

    /**
     * Programmer une campagne
     */
    public function schedule(Request $request, MarketingCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        $validator = Validator::make($request->all(), [
            'scheduled_at' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $campaign->schedule($request->scheduled_at);

            return back()->with('success', 'Campagne programmée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la programmation de campagne: ' . $e->getMessage());
            return back()->withErrors(['schedule' => 'Erreur lors de la programmation: ' . $e->getMessage()]);
        }
    }

    /**
     * Envoyer une campagne
     */
    public function send(MarketingCampaign $campaign)
    {
        $this->authorize('update', $campaign);

        try {
            if (!$campaign->canStart()) {
                return back()->withErrors(['send' => 'Cette campagne ne peut pas être envoyée.']);
            }

            // Obtenir les clients cibles
            $targetClients = $this->getTargetClients($campaign);

            if ($targetClients->isEmpty()) {
                return back()->withErrors(['send' => 'Aucun client cible trouvé pour cette campagne.']);
            }

            // Envoyer les messages
            $sentCount = 0;
            $failedCount = 0;

            foreach ($targetClients as $client) {
                try {
                    $this->whatsappService->sendCampaignMessage(
                        $client,
                        $campaign,
                        [
                            'user_id' => auth()->id(),
                        ]
                    );
                    $sentCount++;
                } catch (\Exception $e) {
                    $failedCount++;
                    Log::error("Erreur lors de l'envoi de la campagne {$campaign->id} au client {$client->id}: " . $e->getMessage());
                }
            }

            // Mettre à jour les métriques
            $campaign->updateMetrics([
                'sent' => $sentCount,
                'failed' => $failedCount,
                'total_targets' => $targetClients->count(),
            ]);

            $message = "Campagne envoyée avec succès. {$sentCount} messages envoyés, {$failedCount} échecs.";
            return back()->with('success', $message);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de campagne: ' . $e->getMessage());
            return back()->withErrors(['send' => 'Erreur lors de l\'envoi: ' . $e->getMessage()]);
        }
    }

    /**
     * Dupliquer une campagne
     */
    public function duplicate(MarketingCampaign $campaign)
    {
        $this->authorize('view', $campaign);

        try {
            $newCampaign = $campaign->replicate();
            $newCampaign->name = $campaign->name . ' (Copie)';
            $newCampaign->status = 'draft';
            $newCampaign->started_at = null;
            $newCampaign->completed_at = null;
            $newCampaign->scheduled_at = null;
            $newCampaign->metrics = [];
            $newCampaign->save();

            return redirect()->route('marketing.campaigns.edit', $newCampaign)
                ->with('success', 'Campagne dupliquée avec succès.');
        } catch (\Exception $e) {
            Log::error('Erreur lors de la duplication de campagne: ' . $e->getMessage());
            return back()->withErrors(['duplication' => 'Erreur lors de la duplication: ' . $e->getMessage()]);
        }
    }

    /**
     * Obtenir les métriques d'une campagne
     */
    public function getMetrics(MarketingCampaign $campaign)
    {
        $this->authorize('view', $campaign);

        $metrics = $this->calculateCampaignMetrics($campaign);

        return response()->json([
            'success' => true,
            'metrics' => $metrics
        ]);
    }

    /**
     * Obtenir les clients cibles d'une campagne
     */
    private function getTargetClients($campaign)
    {
        $query = \App\Models\MarketingClient::where('user_id', auth()->id())
            ->where('status', 'active');

        // Appliquer les critères de ciblage
        if (!empty($campaign->target_audience)) {
            if (isset($campaign->target_audience['tags']) && !empty($campaign->target_audience['tags'])) {
                $query->whereJsonContains('tags', $campaign->target_audience['tags']);
            }

            if (isset($campaign->target_audience['status']) && !empty($campaign->target_audience['status'])) {
                $query->where('status', $campaign->target_audience['status']);
            }

            if (isset($campaign->target_audience['min_engagement']) && !empty($campaign->target_audience['min_engagement'])) {
                // Logique pour filtrer par engagement
            }
        }

        return $query->get();
    }

    /**
     * Calculer les métriques d'une campagne
     */
    private function calculateCampaignMetrics($campaign)
    {
        $metrics = $campaign->metrics ?? [];

        return [
            'total_targets' => $metrics['total_targets'] ?? 0,
            'sent' => $metrics['sent'] ?? 0,
            'delivered' => $metrics['delivered'] ?? 0,
            'read' => $metrics['read'] ?? 0,
            'failed' => $metrics['failed'] ?? 0,
            'delivery_rate' => $campaign->getDeliveryRate(),
            'read_rate' => $campaign->getReadRate(),
            'engagement_rate' => $this->calculateEngagementRate($campaign),
        ];
    }

    /**
     * Calculer le taux d'engagement
     */
    private function calculateEngagementRate($campaign)
    {
        $metrics = $campaign->metrics ?? [];
        $totalSent = $metrics['sent'] ?? 0;

        if ($totalSent === 0) return 0;

        $totalEngagement = ($metrics['read'] ?? 0) + ($metrics['delivered'] ?? 0);
        return round(($totalEngagement / $totalSent) * 100, 1);
    }

    /**
     * Obtenir les statistiques globales des campagnes
     */
    public function getGlobalStats()
    {
        $stats = [
            'total_campaigns' => MarketingCampaign::where('user_id', auth()->id())->count(),
            'active_campaigns' => MarketingCampaign::where('user_id', auth()->id())->where('status', 'active')->count(),
            'scheduled_campaigns' => MarketingCampaign::where('user_id', auth()->id())->where('status', 'scheduled')->count(),
            'completed_campaigns' => MarketingCampaign::where('user_id', auth()->id())->where('status', 'completed')->count(),
            'total_messages_sent' => MarketingCampaign::where('user_id', auth()->id())->sum(DB::raw("JSON_EXTRACT(metrics, '$.sent')")),
            'average_delivery_rate' => $this->calculateAverageDeliveryRate(),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats
        ]);
    }

    /**
     * Calculer le taux de livraison moyen
     */
    private function calculateAverageDeliveryRate()
    {
        $campaigns = MarketingCampaign::where('user_id', auth()->id())
            ->where('status', 'completed')
            ->get();

        if ($campaigns->isEmpty()) return 0;

        $totalRate = 0;
        $count = 0;

        foreach ($campaigns as $campaign) {
            $rate = $campaign->getDeliveryRate();
            if ($rate > 0) {
                $totalRate += $rate;
                $count++;
            }
        }

        return $count > 0 ? round($totalRate / $count, 1) : 0;
    }
}