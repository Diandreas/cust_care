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

        // 1. Préparation des données des messages
        $messageData = [];
        $messagesToSend = [];

        foreach ($recipients as $recipient) {
            // Personnaliser le message
            $personalizedMessage = $this->personalizeMessage(
                $this->campaign->message_content,
                $recipient
            );
            
            // Préparer une entrée pour l'envoi au service SMS
            $messagesToSend[] = [
                'to' => $recipient->phone,
                'content' => $personalizedMessage,
                'client_id' => $recipient->id
            ];
            
            // Préparer les données pour insertion en base
            $messageData[] = [
                'user_id' => $user->id,
                'client_id' => $recipient->id,
                'campaign_id' => $this->campaign->id,
                'content' => $personalizedMessage,
                'type' => 'promotional',
                'status' => 'pending', // Statut initial en attente
                'sent_at' => now(),
            ];
        }
        
        // Aucun message à envoyer
        if (empty($messageData)) {
            Log::warning("Aucun destinataire valide dans le chunk #{$this->chunkIndex} de la campagne #{$this->campaign->id}");
            return;
        }
        
        // 2. Insertion en masse des messages
        $createdMessages = [];
        DB::transaction(function() use ($messageData, &$createdMessages) {
            $createdMessages = Message::insert($messageData);
            return true;
        });
        
        // 3. Envoi des SMS
        $results = [
            'success' => [],
            'failed' => []
        ];
        
        foreach ($messagesToSend as $index => $message) {
            try {
                // Envoyer le SMS
                $result = $smsService->send($message['to'], $message['content']);
                
                if ($result->isSuccess()) {
                    $results['success'][$index] = [
                        'message_id' => $result->getMessageId(),
                        'client_id' => $message['client_id']
                    ];
                } else {
                    $results['failed'][$index] = [
                        'error' => $result->getError(),
                        'client_id' => $message['client_id']
                    ];
                }
            } catch (\Exception $e) {
                Log::error("Erreur d'envoi SMS", [
                    'error' => $e->getMessage(),
                    'client_id' => $message['client_id'],
                    'campaign_id' => $this->campaign->id
                ]);
                
                $results['failed'][$index] = [
                    'error' => $e->getMessage(),
                    'client_id' => $message['client_id']
                ];
            }
        }
        
        // 4. Mise à jour des statuts en masse
        $this->updateMessageStatuses($messageData, $results);
        
        // 5. Mise à jour des compteurs de la campagne
        $deliveredCount = count($results['success']);
        $failedCount = count($results['failed']);
        
        Campaign::where('id', $this->campaign->id)->update([
            'delivered_count' => DB::raw("delivered_count + $deliveredCount"),
            'failed_count' => DB::raw("failed_count + $failedCount"),
        ]);
        
        // 6. Suivi d'utilisation
        $usageTracker->trackSmsUsage($user, $deliveredCount, 'campaign');
        
        Log::info("Chunk #{$this->chunkIndex} de la campagne #{$this->campaign->id} traité", [
            'delivered' => $deliveredCount,
            'failed' => $failedCount
        ]);
    }
    
    /**
     * Méthode auxiliaire pour mise à jour des statuts des messages
     */
    private function updateMessageStatuses(array $messages, array $results): void
    {
        // Conversion des index en identifiants pour les messages réussis
        $successMessageIds = [];
        foreach ($results['success'] as $index => $result) {
            $client_id = $result['client_id'];
            // Trouver le message correspondant
            foreach ($messages as $key => $message) {
                if ($message['client_id'] == $client_id) {
                    $messageId = $message['id'] ?? null;
                    if ($messageId) {
                        $successMessageIds[$messageId] = $result['message_id'];
                    }
                    break;
                }
            }
        }
        
        // Mise à jour en masse des messages réussis si nous avons des IDs
        if (!empty($successMessageIds)) {
            foreach ($successMessageIds as $id => $messageId) {
                Message::where('id', $id)->update([
                    'status' => 'delivered',
                    'delivered_at' => now(),
                    'message_id' => $messageId
                ]);
            }
        }
        
        // Même processus pour les messages échoués
        $failedMessageIds = [];
        foreach ($results['failed'] as $index => $result) {
            $client_id = $result['client_id'];
            foreach ($messages as $key => $message) {
                if ($message['client_id'] == $client_id) {
                    $messageId = $message['id'] ?? null;
                    if ($messageId) {
                        $failedMessageIds[$messageId] = $result['error'];
                    }
                    break;
                }
            }
        }
        
        // Mise à jour en masse des messages échoués
        if (!empty($failedMessageIds)) {
            foreach ($failedMessageIds as $id => $error) {
                Message::where('id', $id)->update([
                    'status' => 'failed',
                    'error_message' => $error
                ]);
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
