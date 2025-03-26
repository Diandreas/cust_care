<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessCampaignJob;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\Tag;
use App\Models\Category;
use App\Models\Template;
use App\Services\UsageTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
    
    /**
     * Afficher la liste des campagnes
     */
    public function index()
    {
        $campaigns = Auth::user()->campaigns()->orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('Campaigns/Index', [
            'campaigns' => $campaigns
        ]);
    }

    /**
     * Afficher la page de création de campagne
     */
    public function create()
    {
        $user = Auth::user();

        // Chargement des catégories avec count
        $categories = $user->categories()
            ->withCount('clients')
            ->get();

        // Chargement des tags avec count
        $tags = $user->tags()
            ->withCount('clients')
            ->get();

        // Clients avec leurs tags et catégorie
        $clients = $user->clients()
            ->with(['tags', 'category'])
            ->withCount('messages')
            ->get();

        $templates = $user->templates()->get();

        return Inertia::render('Campaigns/Create', [
            'categories' => $categories,
            'tags' => $tags,
            'clients' => $clients,
            'templates' => $templates
        ]);
    }

    /**
     * Stocker une nouvelle campagne
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'message_content' => 'required|string',
            'scheduled_at' => 'nullable|date',
            'client_ids' => 'required|array',
            'client_ids.*' => 'exists:clients,id',
            'filter_criteria' => 'nullable|array'
        ]);

        $user = Auth::user();
        
        // Déterminer les IDs clients en fonction des critères de filtre si fournis
        $clientIds = $validated['client_ids'];
        if (!empty($validated['filter_criteria'])) {
            $query = Client::where('user_id', $user->id);
            
            // Appliquer les filtres
            if (!empty($validated['filter_criteria']['tags'])) {
                $query->whereHas('tags', function($q) use ($validated) {
                    $q->whereIn('tags.id', $validated['filter_criteria']['tags']);
                });
            }
            
            if (!empty($validated['filter_criteria']['categories'])) {
                $query->whereIn('category_id', $validated['filter_criteria']['categories']);
            }
            
            // Autres filtres...
            
            $clientIds = $query->pluck('id')->toArray();
        }
        
        $clientsCount = count($clientIds);

        // Vérifier les quotas
        if (!$this->usageTracker->canSendSms($user, $clientsCount)) {
            return redirect()->back()->with('error', 'Votre quota SMS est insuffisant pour cette campagne. Veuillez acheter des SMS supplémentaires.');
        }

        if (!$this->usageTracker->trackCampaignUsage($user)) {
            return redirect()->route('subscription.index')->with('error', 'Vous avez atteint votre limite de campagnes pour ce mois-ci. Veuillez mettre à jour votre abonnement pour continuer.');
        }

        // Créer la campagne en transaction pour garantir l'intégrité
        DB::beginTransaction();
        try {
            $campaign = new Campaign();
            $campaign->user_id = Auth::id();
            $campaign->name = $validated['name'];
            $campaign->message_content = $validated['message_content'];
            $campaign->scheduled_at = $validated['scheduled_at'] ?? null;
            $campaign->status = $validated['scheduled_at'] ? 'scheduled' : 'draft';
            $campaign->recipients_count = $clientsCount;
            $campaign->save();

            $campaign->recipients()->attach($clientIds);
            
            // Si la campagne doit être envoyée immédiatement
            if (empty($validated['scheduled_at']) && $request->input('send_now', false)) {
                ProcessCampaignJob::dispatch($campaign);
                $campaign->status = 'sending';
                $campaign->save();
            }
            
            DB::commit();
            
            return redirect()->route('campaigns.index')->with('success', 'Campagne créée avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Une erreur est survenue lors de la création de la campagne: ' . $e->getMessage());
        }
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
        
        $user = Auth::user();
        
        // Chargement des catégories avec count
        $categories = $user->categories()
            ->withCount('clients')
            ->get();

        // Chargement des tags avec count
        $tags = $user->tags()
            ->withCount('clients')
            ->get();

        // Clients avec leurs tags et catégorie
        $clients = $user->clients()
            ->with(['tags', 'category'])
            ->withCount('messages')
            ->get();
            
        $templates = $user->templates()->get();

        return Inertia::render('Campaigns/Edit', [
            'campaign' => $campaign,
            'categories' => $categories,
            'tags' => $tags,
            'clients' => $clients,
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
            'client_ids.*' => 'exists:clients,id',
            'filter_criteria' => 'nullable|array'
        ]);

        // Vérifier que la campagne n'est pas déjà en cours d'envoi ou terminée
        if (in_array($campaign->status, ['sending', 'sent'])) {
            return redirect()->back()->with('error', 'Impossible de modifier une campagne déjà envoyée ou en cours d\'envoi.');
        }

        // Déterminer les IDs clients en fonction des critères de filtre si fournis
        $clientIds = $validated['client_ids'];
        if (!empty($validated['filter_criteria'])) {
            $query = Client::where('user_id', Auth::id());
            
            // Appliquer les filtres
            if (!empty($validated['filter_criteria']['tags'])) {
                $query->whereHas('tags', function($q) use ($validated) {
                    $q->whereIn('tags.id', $validated['filter_criteria']['tags']);
                });
            }
            
            if (!empty($validated['filter_criteria']['categories'])) {
                $query->whereIn('category_id', $validated['filter_criteria']['categories']);
            }
            
            $clientIds = $query->pluck('id')->toArray();
        }
        
        DB::beginTransaction();
        try {
            $campaign->name = $validated['name'];
            $campaign->message_content = $validated['message_content'];
            $campaign->scheduled_at = $validated['scheduled_at'] ?? null;
            $campaign->status = $validated['scheduled_at'] ? 'scheduled' : 'draft';
            $campaign->recipients_count = count($clientIds);
            $campaign->save();

            $campaign->recipients()->sync($clientIds);
            
            // Si la campagne doit être envoyée immédiatement
            if (empty($validated['scheduled_at']) && $request->input('send_now', false)) {
                ProcessCampaignJob::dispatch($campaign);
                $campaign->status = 'sending';
                $campaign->save();
            }
            
            DB::commit();
            
            return redirect()->route('campaigns.index')->with('success', 'Campagne mise à jour avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Une erreur est survenue lors de la mise à jour de la campagne: ' . $e->getMessage());
        }
    }

    public function destroy(Campaign $campaign)
    {
        $this->authorize('delete', $campaign);

        // Vérifier que la campagne n'est pas déjà en cours d'envoi ou terminée
        if (in_array($campaign->status, ['sending', 'sent'])) {
            return redirect()->back()->with('error', 'Impossible de supprimer une campagne déjà envoyée ou en cours d\'envoi.');
        }

        $campaign->delete();

        return redirect()->route('campaigns.index')->with('success', 'Campagne supprimée avec succès.');
    }

    public function changeStatus(Request $request, Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        $validated = $request->validate([
            'status' => 'required|in:draft,scheduled,paused,cancelled'
        ]);
        
        $oldStatus = $campaign->status;

        // Vérifier les transitions de statut valides
        if ($oldStatus === 'sent') {
            return redirect()->back()->with('error', 'Impossible de modifier le statut d\'une campagne déjà envoyée.');
        }

        if ($oldStatus === 'sending' && !in_array($validated['status'], ['paused', 'cancelled'])) {
            return redirect()->back()->with('error', 'Une campagne en cours d\'envoi ne peut être que mise en pause ou annulée.');
        }

        $campaign->status = $validated['status'];
        $campaign->save();

        return redirect()->back()->with('success', 'Statut de la campagne mis à jour.');
    }
    
    /**
     * Annuler une campagne programmée ou en cours
     */
    public function cancel(Campaign $campaign)
    {
        $this->authorize('update', $campaign);

        if (!in_array($campaign->status, ['scheduled', 'sending', 'paused'])) {
            return redirect()->back()->with('error', 'Seules les campagnes programmées, en cours ou en pause peuvent être annulées.');
        }

        $campaign->status = 'cancelled';
        $campaign->save();

        return redirect()->back()->with('success', 'La campagne a été annulée.');
    }
}
