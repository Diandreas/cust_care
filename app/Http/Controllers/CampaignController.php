<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessCampaignJob;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\Category;
use App\Models\Template;
use App\Services\UsageTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CampaignController extends Controller
{
    protected $usageTracker;

    public function __construct(UsageTrackingService $usageTracker)
    {
        $this->usageTracker = $usageTracker;
    }
    /**
     * Réessayer l'envoi d'une campagne échouée
     */
    public function retry(Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        if ($campaign->status !== 'failed') {
            return redirect()->back()->with('error', 'Seules les campagnes ayant échoué peuvent être réessayées.');
        }

        // Réinitialiser les compteurs
        $campaign->status = 'scheduled';
        $campaign->delivered_count = 0;
        $campaign->failed_count = 0;
        $campaign->save();

        // Dispatcher le job
        ProcessCampaignJob::dispatch($campaign);

        return redirect()->back()->with('success', 'La campagne a été remise en file d\'attente pour un nouvel envoi.');
    }
    public function index()
    {
        $campaigns = Auth::user()->campaigns()->orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns
        ]);
    }

    public function create()
    {
        $user = Auth::user();

        // Chargement des catégories avec leurs clients
        $categories = $user->categories()->with('clients')->get();

        // Chargement de tous les clients sans catégorie
        $clientsWithoutCategory = $user->clients()
            ->whereNull('category_id')
            ->get();

        // Ajout d'une "catégorie virtuelle" pour les clients sans catégorie
        if ($clientsWithoutCategory->count() > 0) {
            $categories->push([
                'id' => 0,
                'name' => 'Sans catégorie',
                'clients' => $clientsWithoutCategory
            ]);
        }

        $templates = $user->templates()->get();

        return Inertia::render('Campaigns/Create', [
            'categories' => $categories,
            'templates' => $templates,
            'allClients' => $user->clients()->get() // Envoi de tous les clients en plus
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'message_content' => 'required|string',
            'scheduled_at' => 'nullable|date',
            'client_ids' => 'required|array',
            'client_ids.*' => 'exists:clients,id'
        ]);

        $user = Auth::user();
        $clientsCount = count($validated['client_ids']);

        // Vérifier si l'utilisateur peut envoyer des SMS à tous ces clients
        if (!$this->usageTracker->canSendSms($user, $clientsCount)) {
            return redirect()->back()->with('error', 'Votre quota SMS est insuffisant pour cette campagne. Veuillez acheter des SMS supplémentaires.');
        }

        // Vérifier si l'utilisateur peut créer une nouvelle campagne
        if (!$this->usageTracker->trackCampaignUsage($user)) {
            return redirect()->route('subscription.index')->with('error', 'Vous avez atteint votre limite de campagnes pour ce mois-ci. Veuillez mettre à jour votre abonnement pour continuer.');
        }

        $campaign = new Campaign();
        $campaign->user_id = Auth::id();
        $campaign->name = $validated['name'];
        $campaign->message_content = $validated['message_content'];
        $campaign->scheduled_at = $validated['scheduled_at'] ?? null;
        $campaign->status = $validated['scheduled_at'] ? 'scheduled' : 'draft';
        $campaign->recipients_count = $clientsCount;
        $campaign->save();

        $campaign->recipients()->attach($validated['client_ids']);

        return redirect()->route('campaigns.index')->with('success', 'Campagne créée avec succès.');
    }

    public function show(Campaign $campaign)
    {
        $this->authorize('view', $campaign);

        $campaign->load('recipients');

        return Inertia::render('Campaigns/Show', [
            'campaign' => $campaign
        ]);
    }

    public function edit(Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $campaign->load('recipients');
        $categories = Auth::user()->categories()->with('clients')->get();
        $templates = Auth::user()->templates()->get();

        return Inertia::render('Campaigns/Edit', [
            'campaign' => $campaign,
            'categories' => $categories,
            'templates' => $templates,
            'selected_clients' => $campaign->recipients->pluck('id')
        ]);
    }

    public function update(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'message_content' => 'required|string',
            'scheduled_at' => 'nullable|date',
            'client_ids' => 'required|array',
            'client_ids.*' => 'exists:clients,id'
        ]);

        $campaign->name = $validated['name'];
        $campaign->message_content = $validated['message_content'];
        $campaign->scheduled_at = $validated['scheduled_at'] ?? null;
        $campaign->status = $validated['scheduled_at'] ? 'scheduled' : 'draft';
        $campaign->recipients_count = count($validated['client_ids']);
        $campaign->save();

        $campaign->recipients()->sync($validated['client_ids']);

        return redirect()->route('campaigns.index')->with('success', 'Campagne mise à jour avec succès.');
    }

    public function destroy(Campaign $campaign)
    {
        $this->authorize('delete', $campaign);

        $campaign->delete();

        return redirect()->route('campaigns.index')->with('success', 'Campagne supprimée avec succès.');
    }

    public function changeStatus(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $validated = $request->validate([
            'status' => 'required|in:draft,scheduled,sent,paused'
        ]);

        $campaign->status = $validated['status'];
        $campaign->save();

        return redirect()->back()->with('success', 'Statut de la campagne mis à jour.');
    }
}
