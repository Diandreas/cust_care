<?php

namespace App\Jobs;

use App\Models\Campaign;
use Illuminate\Bus\Batch;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ProcessCampaignJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $campaign;
    
    // Nombre maximal de tentatives
    public $tries = 3;
    
    // Timeout du job en secondes
    public $timeout = 600;

    /**
     * Create a new job instance.
     */
    public function __construct(Campaign $campaign)
    {
        $this->campaign = $campaign;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Éviter le traitement multiple de la même campagne
        $lockKey = "campaign_processing_{$this->campaign->id}";
        if (Cache::has($lockKey)) {
            Log::info("Campagne #{$this->campaign->id} déjà en cours de traitement");
            return;
        }
        
        // Verrouiller le traitement pour 10 minutes
        Cache::put($lockKey, true, 600);
        
        try {
            // Rafraîchir les données de la campagne
            $this->campaign->refresh();
            
            // Vérifier si la campagne est déjà en cours de traitement ou terminée
            if (in_array($this->campaign->status, ['sending', 'sent'])) {
                Log::info("Campagne #{$this->campaign->id} déjà en traitement ou envoyée");
                Cache::forget($lockKey);
                return;
            }
            
            // Marquer comme "sending"
            $this->campaign->status = 'sending';
            $this->campaign->save();

            // Créer un lot de jobs pour l'envoi en parallèle
            $recipients = $this->campaign->recipients;
            
            // Vérifier qu'il y a des destinataires
            if ($recipients->isEmpty()) {
                Log::warning("Campagne #{$this->campaign->id} sans destinataires");
                $this->campaign->status = 'failed';
                $this->campaign->error_message = 'Aucun destinataire trouvé pour cette campagne';
                $this->campaign->save();
                Cache::forget($lockKey);
                return;
            }

            // Diviser les envois en lots de 100
            $chunks = $recipients->chunk(100);
            $jobs = [];

            foreach ($chunks as $index => $chunk) {
                $jobs[] = new SendCampaignChunkJob(
                    $this->campaign,
                    $chunk->pluck('id')->toArray(),
                    $index
                );
            }

            // Utiliser le Bus de Laravel pour gérer le lot
            Bus::batch($jobs)
                ->then(function () use ($lockKey) {
                    // Mise à jour après l'envoi de tous les lots
                    $this->campaign->refresh();
                    $this->campaign->status = 'sent';
                    $this->campaign->save();

                    Log::info("Campagne #{$this->campaign->id} terminée avec succès");
                    Cache::forget($lockKey);
                })
                ->catch(function (Batch $batch) use ($lockKey) {
                    // Gérer les échecs
                    $this->campaign->refresh();

                    // Si tous les messages ont échoué
                    if ($this->campaign->delivered_count === 0) {
                        $this->campaign->status = 'failed';
                    } else {
                        // Si certains messages ont été envoyés
                        $this->campaign->status = 'sent';
                    }
                    
                    // Enregistrer les détails de l'erreur
                    $this->campaign->error_message = "Échec durant l'envoi: " . 
                        $batch->failedJobs . " jobs ont échoué sur " . $batch->totalJobs;

                    $this->campaign->save();

                    Log::warning("Campagne #{$this->campaign->id} terminée avec des erreurs", [
                        'delivered' => $this->campaign->delivered_count,
                        'failed' => $this->campaign->failed_count,
                        'failed_jobs' => $batch->failedJobs,
                        'total_jobs' => $batch->totalJobs
                    ]);
                    
                    Cache::forget($lockKey);
                })
                ->name("Campaign: {$this->campaign->name}")
                ->allowFailures()
                ->dispatch();
        } catch (\Exception $e) {
            // En cas d'erreur grave, marquer la campagne comme échouée
            $this->campaign->status = 'failed';
            $this->campaign->error_message = $e->getMessage();
            $this->campaign->save();

            // Log détaillé
            Log::error('Campaign processing failed', [
                'campaign_id' => $this->campaign->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            // Libérer le verrou
            Cache::forget($lockKey);
            
            // Relancer l'exception pour que Laravel gère la tentative
            throw $e;
        }
    }
    
    /**
     * Gestion des échecs du job
     */
    public function failed(\Throwable $exception)
    {
        // S'assurer que le statut est mis à jour
        $this->campaign->status = 'failed';
        $this->campaign->save();
        
        // Libérer le verrou
        Cache::forget("campaign_processing_{$this->campaign->id}");
        
        Log::error("Échec du job de traitement de campagne", [
            'campaign_id' => $this->campaign->id,
            'error' => $exception->getMessage()
        ]);
    }
}
