<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessCampaignJob;
use App\Models\Campaign;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CampaignRetryController extends Controller
{
    /**
     * Afficher la page de diagnostic d'une campagne échouée
     */
    public function diagnostics(Campaign $campaign)
    {
        $this->authorize('view', $campaign);
        
        if ($campaign->status !== 'failed' && $campaign->status !== 'partially_sent') {
            return redirect()->route('campaigns.show', $campaign->id)
                ->with('error', 'Seules les campagnes échouées peuvent être diagnostiquées.');
        }
        
        // Récupérer les messages échoués
        $failedMessages = Message::where('campaign_id', $campaign->id)
            ->where('status', 'failed')
            ->with('client')
            ->get();
        
        // Récupérer les erreurs les plus courantes
        $commonErrors = Message::where('campaign_id', $campaign->id)
            ->where('status', 'failed')
            ->select('error_message', DB::raw('count(*) as count'))
            ->groupBy('error_message')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();
        
        return Inertia::render('Campaigns/Diagnostics', [
            'campaign' => $campaign,
            'failedMessages' => $failedMessages,
            'commonErrors' => $commonErrors
        ]);
    }
    
    /**
     * Réessayer d'envoyer les messages échoués uniquement
     */
    public function retryFailed(Campaign $campaign)
    {
        $this->authorize('update', $campaign);
        
        if ($campaign->status !== 'failed' && $campaign->status !== 'partially_sent') {
            return redirect()->back()->with('error', 'Seules les campagnes échouées peuvent être réessayées.');
        }
        
        // Obtenir les IDs clients dont les messages ont échoué
        $failedClientIds = Message::where('campaign_id', $campaign->id)
            ->where('status', 'failed')
            ->pluck('client_id')
            ->unique()
            ->values()
            ->toArray();
        
        if (empty($failedClientIds)) {
            return redirect()->back()->with('error', 'Aucun message échoué à réessayer.');
        }
        
        // Créer une nouvelle campagne pour les messages échoués
        $newCampaign = $campaign->replicate();
        $newCampaign->name = "{$campaign->name} (Retry)";
        $newCampaign->status = 'scheduled';
        $newCampaign->delivered_count = 0;
        $newCampaign->failed_count = 0;
        $newCampaign->recipients_count = count($failedClientIds);
        $newCampaign->save();
        
        // Attacher seulement les destinataires dont l'envoi a échoué
        $newCampaign->recipients()->attach($failedClientIds);
        
        // Envoyer immédiatement
        ProcessCampaignJob::dispatch($newCampaign);
        
        return redirect()->route('campaigns.show', $newCampaign->id)
            ->with('success', 'Une nouvelle campagne a été créée pour réessayer l\'envoi aux destinataires qui ont échoué.');
    }
    
    /**
     * Réessayer toute la campagne
     */
    public function retryAll(Campaign $campaign)
    {
        $this->authorize('update', $campaign);
        
        if ($campaign->status !== 'failed' && $campaign->status !== 'partially_sent') {
            return redirect()->back()->with('error', 'Seules les campagnes échouées peuvent être réessayées.');
        }
        
        // Réinitialiser les compteurs
        $campaign->status = 'scheduled';
        $campaign->delivered_count = 0;
        $campaign->failed_count = 0;
        $campaign->save();
        
        // Supprimer les anciens messages
        Message::where('campaign_id', $campaign->id)->delete();
        
        // Dispatcher le job
        ProcessCampaignJob::dispatch($campaign);
        
        return redirect()->route('campaigns.show', $campaign->id)
            ->with('success', 'La campagne a été remise en file d\'attente pour un nouvel envoi complet.');
    }
} 