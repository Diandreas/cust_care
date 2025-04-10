<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessCampaignJob;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\Tag;
use App\Models\Template;
use App\Services\UsageTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

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

        // Chargement des tags avec count
        $tags = $user->tags()
            ->withCount('clients')
            ->get();

        // Clients avec leurs tags
        $clients = $user->clients()
            ->with(['tags'])
            ->withCount('messages')
            ->get();

        $templates = $user->templates()->get();

        return Inertia::render('Campaigns/Create', [
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
            'client_ids' => 'required_without:filter_criteria|array',
            'client_ids.*' => 'exists:clients,id',
            'filter_criteria' => 'required_without:client_ids|array'
        ]);

        $user = Auth::user();
        
        // 1. D'abord extraire et valider les critères de filtre
        $filterCriteria = $request->input('filter_criteria', []);
        
        // 2. Puis déterminer précisément la liste des clients
        $clientIds = $this->resolveClientIds($filterCriteria, $request->input('client_ids', []));
        
        // 3. Ensuite vérifier les quotas (après avoir déterminé le nombre exact)
        $clientsCount = count($clientIds);
        
        if (!$this->usageTracker->canSendSms($user, $clientsCount)) {
            return redirect()->back()->with('error', 'Votre quota SMS est insuffisant pour cette campagne. Veuillez acheter des SMS supplémentaires.');
        }

        if (!$this->usageTracker->trackCampaignUsage($user)) {
            return redirect()->route('subscription.index')->with('error', 'Vous avez atteint votre limite de campagnes pour ce mois-ci. Veuillez mettre à jour votre abonnement pour continuer.');
        }

        // 4. Utiliser une transaction pour éviter les états inconsistants
        DB::beginTransaction();
        try {
            $campaign = new Campaign();
            $campaign->user_id = Auth::id();
            $campaign->name = $validated['name'];
            $campaign->message_content = $validated['message_content'];
            
            // S'assurer que scheduled_at a toujours une valeur (date actuelle si non spécifiée)
            $campaign->scheduled_at = $validated['scheduled_at'] ?? now();
            
            // Déterminer le statut en fonction de l'envoi immédiat ou non
            $sendNow = $request->input('send_now', false);
            $campaign->status = $sendNow ? 'sending' : 'scheduled';
            
            $campaign->recipients_count = $clientsCount;
            $campaign->save();

            $campaign->recipients()->attach($clientIds);
            
            // Si la campagne doit être envoyée immédiatement
            if ($sendNow) {
                ProcessCampaignJob::dispatch($campaign);
            }
            
            DB::commit();
            
            return redirect()->route('campaigns.index')->with('success', 'Campagne créée avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Campaign creation failed', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Une erreur est survenue lors de la création de la campagne: ' . $e->getMessage());
        }
    }

    /**
     * Extraire la logique de résolution des clients dans une méthode privée
     */
    private function resolveClientIds(array $filterCriteria, array $explicitIds): array 
    {
        if (empty($filterCriteria)) {
            return $explicitIds;
        }
        
        $query = Client::where('user_id', Auth::id())
            ->with('tags')
            ->when(!empty($filterCriteria['tags']), function($q) use ($filterCriteria) {
                $q->whereHas('tags', function($q) use ($filterCriteria) {
                    $q->whereIn('tags.id', $filterCriteria['tags']);
                });
            });
        
        return $query->pluck('id')->toArray();
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
        
        // Chargement des tags avec count
        $tags = $user->tags()
            ->withCount('clients')
            ->get();

        // Clients avec leurs tags
        $clientIds = $campaign->recipients->pluck('id');
        $clients = Client::whereIn('id', $clientIds)
            ->where('user_id', Auth::id())
            ->with('tags')
            ->get();
            
        $templates = $user->templates()->get();

        return Inertia::render('Campaigns/Edit', [
            'campaign' => $campaign,
            'tags' => $tags,
            'clients' => $clients,
            'templates' => $templates,
            'selected_clients' => $campaign->recipients->pluck('id')
        ]);
    }

    public function update(Request $request, Campaign $campaign)
    {
        try {
            $this->authorize('update', $campaign);
            
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'message_content' => 'required|string',
                'scheduled_at' => 'nullable|date',
                'client_ids' => 'required|array',
                'client_ids.*' => 'exists:clients,id',
                'filter_criteria' => 'nullable|array'
            ]);

            // Déterminer les IDs clients en fonction des critères de filtre si fournis
            $clientIds = $validated['client_ids'];
            if (!empty($validated['filter_criteria'])) {
                $query = Client::where('user_id', Auth::id())
                    ->with('tags')
                    ->when(!empty($validated['filter_criteria']['tags']), function($q) use ($validated) {
                        $q->whereHas('tags', function($q) use ($validated) {
                            $q->whereIn('tags.id', $validated['filter_criteria']['tags']);
                        });
                    });
                
                $clientIds = $query->pluck('id')->toArray();
            }

            $user = Auth::user();
            $clientsCount = count($clientIds);

            // Vérifier les quotas si le nombre de destinataires a augmenté
            if ($clientsCount > $campaign->recipients_count && !$this->usageTracker->canSendSms($user, $clientsCount - $campaign->recipients_count)) {
                return redirect()->back()->with('error', 'Votre quota SMS est insuffisant pour cette campagne. Veuillez acheter des SMS supplémentaires.');
            }

            // Mettre à jour en transaction
            DB::beginTransaction();
            try {
                $campaign->name = $validated['name'];
                $campaign->message_content = $validated['message_content'];
                
                // S'assurer que scheduled_at a toujours une valeur (date actuelle si non spécifiée)
                $campaign->scheduled_at = $validated['scheduled_at'] ?? now();
                
                // Déterminer le statut en fonction de l'envoi immédiat ou non
                $sendNow = $request->input('send_now', false);
                if ($sendNow && $campaign->status !== 'sent' && $campaign->status !== 'sending') {
                    $campaign->status = 'sending';
                } elseif ($campaign->status !== 'sent' && $campaign->status !== 'sending') {
                    $campaign->status = 'scheduled';
                }
                
                $campaign->recipients_count = $clientsCount;
                $campaign->save();

                // Mettre à jour les destinataires
                $campaign->recipients()->sync($clientIds);

                // Si la campagne doit être envoyée immédiatement
                if ($sendNow && $campaign->status === 'sending') {
                    ProcessCampaignJob::dispatch($campaign);
                }

                DB::commit();

                return redirect()->route('campaigns.show', $campaign->id)->with('success', 'Campagne mise à jour avec succès.');
            } catch (\Exception $e) {
                DB::rollBack();
                return redirect()->back()->with('error', 'Une erreur est survenue lors de la mise à jour de la campagne: ' . $e->getMessage());
            }
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            // Gestion spécifique pour les erreurs d'autorisation
            if (in_array($campaign->status, ['sent', 'sending', 'partially_sent'])) {
                return redirect()->route('campaigns.show', $campaign)->with('error', 
                    'Impossible de modifier cette campagne car elle a déjà été envoyée ou est en cours d\'envoi.');
            }
            
            return redirect()->route('campaigns.index')->with('error', 
                'Vous n\'êtes pas autorisé à modifier cette campagne.');
        }
    }

    public function destroy(Campaign $campaign)
    {
        try {
            $this->authorize('delete', $campaign);
            
            $campaign->delete();
            
            return redirect()->route('campaigns.index')->with('success', 'Campagne supprimée avec succès.');
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            // Gestion spécifique pour les erreurs d'autorisation
            if (in_array($campaign->status, ['sent', 'sending', 'partially_sent'])) {
                return redirect()->route('campaigns.index')->with('error', 
                    'Impossible de supprimer cette campagne car elle a déjà été envoyée ou est en cours d\'envoi.');
            }
            
            return redirect()->route('campaigns.index')->with('error', 
                'Vous n\'êtes pas autorisé à supprimer cette campagne.');
        }
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
