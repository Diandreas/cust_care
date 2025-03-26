<?php

namespace App\Jobs;

use App\Models\Campaign;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;

class ProcessCampaignJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $campaign;

    public function __construct(Campaign $campaign)
    {
        $this->campaign = $campaign;
    }

    public function handle()
    {
        // Marquer comme "sending"
        $this->campaign->status = 'sending';
        $this->campaign->save();

        // Créer un lot de jobs pour l'envoi en parallèle
        $recipients = $this->campaign->recipients;

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

        // Utiliser le Bus de Laravel 12 pour gérer le lot
        Bus::batch($jobs)
            ->then(function () {
                // Mise à jour après l'envoi de tous les lots
                $this->campaign->refresh();
                $this->campaign->status = 'sent';
                $this->campaign->save();
            })
            ->catch(function () {
                // Gérer les échecs
                $this->campaign->refresh();

                // Si tous les messages ont échoué
                if ($this->campaign->delivered_count === 0) {
                    $this->campaign->status = 'failed';
                } else {
                    // Si certains messages ont été envoyés
                    $this->campaign->status = 'sent';
                }

                $this->campaign->save();
            })
            ->dispatch();
    }
}
