<?php

namespace App\Services\Campaign;

use App\Models\Campaign;
use App\Models\Client;
use App\Models\User;
use App\Services\UsageTrackingService;
use App\Jobs\ProcessCampaignJob;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Exceptions\InsufficientQuotaException;

class CampaignService
{
    protected $usageTracker;
    
    public function __construct(UsageTrackingService $usageTracker) 
    {
        $this->usageTracker = $usageTracker;
    }
    
    /**
     * Créer une nouvelle campagne
     *
     * @param array $data Les données de la campagne
     * @param User $user L'utilisateur créant la campagne
     * @return Campaign La campagne créée
     * @throws InsufficientQuotaException Si l'utilisateur n'a pas assez de quota
     */
    public function createCampaign(array $data, User $user): Campaign
    {
        // Validation des quotas et autres règles métier
        $clientIds = $this->resolveClientIds($data['filter_criteria'] ?? [], $data['client_ids'] ?? [], $user);
        $clientsCount = count($clientIds);
        
        if (!$this->usageTracker->canSendSms($user, $clientsCount, 'campaign')) {
            throw new InsufficientQuotaException('Quota SMS insuffisant pour cette campagne');
        }
        
        if (!$this->usageTracker->trackCampaignUsage($user)) {
            throw new InsufficientQuotaException('Vous avez atteint votre limite de campagnes pour ce mois-ci');
        }
        
        // Création de la campagne en transaction
        DB::beginTransaction();
        try {
            $campaign = new Campaign();
            $campaign->user_id = $user->id;
            $campaign->name = $data['name'];
            $campaign->message_content = $data['message_content'];
            $campaign->scheduled_at = $data['scheduled_at'] ?? null;
            $campaign->status = $data['scheduled_at'] ? 'scheduled' : 'draft';
            $campaign->recipients_count = $clientsCount;
            $campaign->save();
            
            $campaign->recipients()->attach($clientIds);
            
            // Si envoi immédiat demandé
            if (empty($data['scheduled_at']) && ($data['send_now'] ?? false)) {
                $this->dispatchCampaign($campaign);
            }
            
            DB::commit();
            return $campaign;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Échec de création de campagne', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
    
    /**
     * Mettre à jour une campagne existante
     *
     * @param Campaign $campaign La campagne à mettre à jour
     * @param array $data Les nouvelles données
     * @return Campaign La campagne mise à jour
     * @throws InsufficientQuotaException Si l'utilisateur n'a pas assez de quota
     */
    public function updateCampaign(Campaign $campaign, array $data): Campaign
    {
        $user = $campaign->user;
        
        // Récupérer les IDs clients
        $clientIds = $this->resolveClientIds($data['filter_criteria'] ?? [], $data['client_ids'] ?? [], $user);
        $clientsCount = count($clientIds);
        
        // Vérifier les quotas si le nombre de destinataires augmente
        if ($clientsCount > $campaign->recipients_count) {
            $additionalSms = $clientsCount - $campaign->recipients_count;
            
            if (!$this->usageTracker->canSendSms($user, $additionalSms, 'campaign')) {
                throw new InsufficientQuotaException('Quota SMS insuffisant pour ajouter ces destinataires');
            }
        }
        
        DB::beginTransaction();
        try {
            $campaign->name = $data['name'];
            $campaign->message_content = $data['message_content'];
            $campaign->scheduled_at = $data['scheduled_at'] ?? null;
            
            // Si le statut était "draft", il peut passer à "scheduled"
            if ($campaign->status === 'draft' && $data['scheduled_at']) {
                $campaign->status = 'scheduled';
            }
            
            $campaign->recipients_count = $clientsCount;
            $campaign->save();
            
            // Synchroniser les destinataires
            $campaign->recipients()->sync($clientIds);
            
            // Si envoi immédiat demandé et campagne en brouillon ou programmée
            if (($data['send_now'] ?? false) && in_array($campaign->status, ['draft', 'scheduled'])) {
                $this->dispatchCampaign($campaign);
            }
            
            DB::commit();
            return $campaign;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Échec de mise à jour de campagne', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
    
    /**
     * Réessayer l'envoi d'une campagne échouée
     *
     * @param Campaign $campaign La campagne à réessayer
     * @return Campaign La campagne mise à jour
     */
    public function retryCampaign(Campaign $campaign): Campaign
    {
        if ($campaign->status !== 'failed') {
            throw new \InvalidArgumentException('Seules les campagnes ayant échoué peuvent être réessayées');
        }
        
        // Réinitialiser les compteurs
        $campaign->status = 'scheduled';
        $campaign->delivered_count = 0;
        $campaign->failed_count = 0;
        $campaign->error_message = null;
        $campaign->save();
        
        // Dispatcher le job
        $this->dispatchCampaign($campaign);
        
        return $campaign;
    }
    
    /**
     * Envoyer une campagne en file d'attente pour traitement
     */
    protected function dispatchCampaign(Campaign $campaign): void
    {
        ProcessCampaignJob::dispatch($campaign);
        
        // Mettre à jour le statut si nécessaire
        if ($campaign->status !== 'sending') {
            $campaign->status = 'sending';
            $campaign->save();
        }
    }
    
    /**
     * Résoudre les IDs clients en fonction des critères de filtre
     */
    protected function resolveClientIds(array $filterCriteria, array $explicitIds, User $user): array 
    {
        if (empty($filterCriteria)) {
            return $explicitIds;
        }
        
        $query = Client::where('user_id', $user->id);
        
        // Appliquer tous les filtres nécessaires
        if (!empty($filterCriteria['tags'])) {
            $query->whereHas('tags', function($q) use ($filterCriteria) {
                $q->whereIn('tags.id', $filterCriteria['tags']);
            });
        }
        
        if (!empty($filterCriteria['categories'])) {
            $query->whereIn('category_id', $filterCriteria['categories']);
        }
        
        // Autres filtres possibles...
        
        return $query->pluck('id')->toArray();
    }
} 