<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\Client;
use App\Models\Message;
use App\Services\SmsService;
use App\Services\UsageTrackingService;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SendCampaignChunkJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $campaign;
    protected $recipientIds;
    protected $chunkIndex;

    // Nombre maximal de tentatives
    public $tries = 3;

    // Temps d'attente entre les tentatives (en secondes)
    public $backoff = [30, 60, 120];

    /**
     * Create a new job instance.
     */
    public function __construct(Campaign $campaign, array $recipientIds, int $chunkIndex)
    {
        $this->campaign = $campaign;
        $this->recipientIds = $recipientIds;
        $this->chunkIndex = $chunkIndex;
    }

    /**
     * Execute the job.
     */
    public function handle(SmsService $smsService, UsageTrackingService $usageTracker): void
    {
        if ($this->batch() && $this->batch()->cancelled()) {
            return;
        }

        $user = $this->campaign->user;
        $recipients = Client::whereIn('id', $this->recipientIds)->get();

        $deliveredCount = 0;
        $failedCount = 0;

        // Création d'un tableau de messages pour insertion groupée
        $messages = [];

        foreach ($recipients as $recipient) {
            try {
                // Personnaliser le message
                $personalizedMessage = $this->personalizeMessage(
                    $this->campaign->message_content,
                    $recipient
                );

                // Envoyer le SMS (intégration réelle)
                $result = $smsService->send($recipient->phone, $personalizedMessage);

                // Préparer l'entrée du message
                $messageData = [
                    'user_id' => $user->id,
                    'client_id' => $recipient->id,
                    'campaign_id' => $this->campaign->id,
                    'content' => $personalizedMessage,
                    'status' => $result->isSuccess() ? 'delivered' : 'failed',
                    'type' => 'promotional',
                    'sent_at' => now(),
                    'delivered_at' => $result->isSuccess() ? now() : null,
                ];

                $messages[] = $messageData;

                $result->isSuccess() ? $deliveredCount++ : $failedCount++;
            } catch (\Exception $e) {
                Log::error("Erreur d'envoi SMS", [
                    'error' => $e->getMessage(),
                    'client_id' => $recipient->id,
                    'campaign_id' => $this->campaign->id
                ]);

                $failedCount++;
            }
        }

        // Traiter les messages en lot
        if (!empty($messages)) {
            DB::beginTransaction();
            try {
                // Insertion groupée des messages pour de meilleures performances
                Message::insert($messages);

                // Mettre à jour les compteurs de la campagne de façon atomique
                Campaign::where('id', $this->campaign->id)->update([
                    'delivered_count' => DB::raw("delivered_count + $deliveredCount"),
                    'failed_count' => DB::raw("failed_count + $failedCount"),
                ]);

                // Suivre l'utilisation
                $usageTracker->trackSmsUsage($user, $deliveredCount);

                DB::commit();

                Log::info("Chunk #{$this->chunkIndex} de la campagne #{$this->campaign->id} traité", [
                    'delivered' => $deliveredCount,
                    'failed' => $failedCount
                ]);
            } catch (\Exception $e) {
                DB::rollBack();

                Log::error("Erreur lors de l'enregistrement des résultats pour le chunk #{$this->chunkIndex}", [
                    'error' => $e->getMessage(),
                    'campaign_id' => $this->campaign->id
                ]);

                throw $e; // Relancer pour que le job soit réessayé
            }
        }
    }

    /**
     * Personnaliser le message avec les données du client
     */
    protected function personalizeMessage($template, $client)
    {
        $content = $template;
        $content = str_replace('{{client.name}}', $client->name, $content);
        $content = str_replace('{{client.phone}}', $client->phone, $content);

        // Si disponible, remplacer d'autres variables
        if (!empty($client->email)) {
            $content = str_replace('{{client.email}}', $client->email, $content);
        }

        // Autres remplacements possibles
        $content = str_replace('{{date}}', now()->format('d/m/Y'), $content);
        $content = str_replace('{{time}}', now()->format('H:i'), $content);

        return $content;
    }

    /**
     * Gérer une défaillance du job
     */
    public function failed(\Throwable $exception)
    {
        Log::error('Échec du job d\'envoi de campagne', [
            'chunk_index' => $this->chunkIndex,
            'campaign_id' => $this->campaign->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);
    }
}
