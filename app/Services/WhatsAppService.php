<?php

namespace App\Services;

use App\Models\MarketingClient;
use App\Models\MarketingMessage;
use App\Models\MarketingCampaign;
use Twilio\Rest\Client as TwilioClient;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class WhatsAppService
{
    protected $twilioClient;
    protected $fromNumber;
    protected $whatsappNumber;

    public function __construct()
    {
        $this->fromNumber = config('services.twilio.whatsapp_number');
        $this->whatsappNumber = config('services.twilio.whatsapp_number');
        
        $this->twilioClient = new TwilioClient(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
    }

    /**
     * Envoyer un message WhatsApp à un client
     */
    public function sendMessage(MarketingClient $client, string $message, array $options = []): array
    {
        try {
            // Vérifier que le client n'a pas opté out
            if ($client->isOptedOut()) {
                return [
                    'success' => false,
                    'error' => 'Client a opté out des communications WhatsApp',
                    'code' => 'OPTED_OUT'
                ];
            }

            // Valider le numéro de téléphone
            $phoneNumber = $this->formatPhoneNumber($client->phone);
            if (!$phoneNumber) {
                return [
                    'success' => false,
                    'error' => 'Numéro de téléphone invalide',
                    'code' => 'INVALID_PHONE'
                ];
            }

            // Créer le message en base
            $marketingMessage = MarketingMessage::create([
                'user_id' => $client->user_id,
                'client_id' => $client->id,
                'campaign_id' => $options['campaign_id'] ?? null,
                'type' => 'whatsapp',
                'content' => $message,
                'metadata' => $options,
                'status' => 'pending',
            ]);

            // Envoyer via Twilio
            $twilioMessage = $this->twilioClient->messages->create(
                "whatsapp:{$phoneNumber}",
                [
                    'from' => "whatsapp:{$this->fromNumber}",
                    'body' => $message,
                    'statusCallback' => route('webhooks.twilio.status'),
                    'statusCallbackEvent' => ['delivered', 'read', 'failed'],
                    'statusCallbackMethod' => 'POST',
                ]
            );

            // Mettre à jour le message
            $marketingMessage->update([
                'status' => 'sent',
                'sent_at' => now(),
                'metadata' => array_merge($options, [
                    'twilio_sid' => $twilioMessage->sid,
                    'twilio_status' => $twilioMessage->status,
                ]),
            ]);

            // Mettre à jour le dernier contact du client
            $client->updateLastContact();

            return [
                'success' => true,
                'message_id' => $marketingMessage->id,
                'twilio_sid' => $twilioMessage->sid,
                'status' => $twilioMessage->status,
            ];

        } catch (\Exception $e) {
            Log::error('WhatsApp message sending failed', [
                'client_id' => $client->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Marquer le message comme échoué
            if (isset($marketingMessage)) {
                $marketingMessage->markAsFailed($e->getMessage());
            }

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'code' => 'SENDING_FAILED'
            ];
        }
    }

    /**
     * Envoyer un message en masse à plusieurs clients
     */
    public function sendBulkMessage(array $clientIds, string $message, int $userId, array $options = []): array
    {
        $results = [
            'total' => count($clientIds),
            'success' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        $clients = MarketingClient::whereIn('id', $clientIds)
            ->where('user_id', $userId)
            ->active()
            ->get();

        foreach ($clients as $client) {
            $result = $this->sendMessage($client, $message, $options);
            
            if ($result['success']) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = [
                    'client_id' => $client->id,
                    'error' => $result['error'],
                    'code' => $result['code'] ?? 'UNKNOWN',
                ];
            }

            // Délai anti-spam
            if ($results['success'] > 0 && $results['success'] % 10 === 0) {
                sleep(1);
            }
        }

        return $results;
    }

    /**
     * Envoyer un message de campagne
     */
    public function sendCampaignMessage(MarketingCampaign $campaign, MarketingClient $client): array
    {
        $content = $campaign->content;
        $message = $content['message'] ?? '';

        // Personnaliser le message
        $message = $this->personalizeMessage($message, $client);

        return $this->sendMessage($client, $message, [
            'campaign_id' => $campaign->id,
            'campaign_name' => $campaign->name,
            'type' => 'campaign',
        ]);
    }

    /**
     * Personnaliser un message avec les données du client
     */
    public function personalizeMessage(string $message, MarketingClient $client): string
    {
        $replacements = [
            '{nom}' => $client->name,
            '{prenom}' => explode(' ', $client->name)[0] ?? '',
            '{telephone}' => $client->phone,
            '{email}' => $client->email ?? '',
            '{anniversaire}' => $client->birthday ? $client->birthday->format('d/m') : '',
            '{tags}' => implode(', ', $client->tags ?? []),
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }

    /**
     * Formater un numéro de téléphone pour WhatsApp
     */
    protected function formatPhoneNumber(string $phone): ?string
    {
        // Nettoyer le numéro
        $phone = preg_replace('/[^0-9+]/', '', $phone);

        // Ajouter le préfixe + si absent
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . $phone;
        }

        // Validation basique
        if (strlen($phone) < 10 || strlen($phone) > 15) {
            return null;
        }

        return $phone;
    }

    /**
     * Traiter les webhooks de statut Twilio
     */
    public function processStatusWebhook(array $data): void
    {
        $messageSid = $data['MessageSid'] ?? null;
        $status = $data['MessageStatus'] ?? null;

        if (!$messageSid || !$status) {
            return;
        }

        // Trouver le message par le SID Twilio
        $message = MarketingMessage::where('metadata->twilio_sid', $messageSid)->first();
        
        if (!$message) {
            Log::warning('Message not found for Twilio SID', ['sid' => $messageSid]);
            return;
        }

        // Mettre à jour le statut
        switch ($status) {
            case 'delivered':
                $message->markAsDelivered();
                break;
            case 'read':
                $message->markAsRead();
                break;
            case 'failed':
                $error = $data['ErrorMessage'] ?? 'Unknown error';
                $message->markAsFailed($error);
                break;
        }

        // Mettre à jour les métadonnées
        $metadata = $message->getMetadata();
        $metadata['twilio_status'] = $status;
        $metadata['status_updated_at'] = now()->toISOString();
        $message->setMetadata($metadata);
    }

    /**
     * Traiter les messages entrants WhatsApp
     */
    public function processIncomingMessage(array $data): void
    {
        $from = $data['From'] ?? null;
        $body = $data['Body'] ?? '';
        $messageSid = $data['MessageSid'] ?? null;

        if (!$from || !$body) {
            return;
        }

        // Extraire le numéro de téléphone
        $phone = str_replace('whatsapp:', '', $from);
        
        // Trouver le client
        $client = MarketingClient::where('phone', $phone)->first();
        
        if (!$client) {
            Log::warning('Client not found for incoming WhatsApp message', ['phone' => $phone]);
            return;
        }

        // Traiter les commandes spéciales
        if ($this->isSpecialCommand($body)) {
            $this->processSpecialCommand($client, $body);
            return;
        }

        // Enregistrer le message entrant
        MarketingMessage::create([
            'user_id' => $client->user_id,
            'client_id' => $client->id,
            'type' => 'whatsapp',
            'content' => $body,
            'status' => 'delivered',
            'delivered_at' => now(),
            'metadata' => [
                'direction' => 'incoming',
                'twilio_sid' => $messageSid,
                'type' => 'incoming',
            ],
        ]);

        // Mettre à jour le dernier contact
        $client->updateLastContact();
    }

    /**
     * Vérifier si c'est une commande spéciale
     */
    protected function isSpecialCommand(string $body): bool
    {
        $commands = ['STOP', 'ARRET', 'OPT-OUT', 'UNSUBSCRIBE', 'DESABONNER'];
        return in_array(strtoupper(trim($body)), $commands);
    }

    /**
     * Traiter les commandes spéciales
     */
    protected function processSpecialCommand(MarketingClient $client, string $command): void
    {
        $command = strtoupper(trim($command));
        
        switch ($command) {
            case 'STOP':
            case 'ARRET':
            case 'OPT-OUT':
            case 'UNSUBSCRIBE':
            case 'DESABONNER':
                $client->optOut();
                
                // Envoyer confirmation
                $this->sendMessage($client, 
                    "Vous avez été désabonné des communications WhatsApp. Pour vous réabonner, contactez-nous.",
                    ['type' => 'opt_out_confirmation']
                );
                break;
        }
    }

    /**
     * Obtenir les statistiques WhatsApp
     */
    public function getStats(int $userId, string $period = 'month'): array
    {
        $query = MarketingMessage::where('user_id', $userId)
            ->ofType('whatsapp');

        switch ($period) {
            case 'today':
                $query->sentToday();
                break;
            case 'week':
                $query->sentThisWeek();
                break;
            case 'month':
                $query->sentThisMonth();
                break;
        }

        $total = $query->count();
        $sent = $query->sent()->count();
        $delivered = $query->delivered()->count();
        $read = $query->read()->count();
        $failed = $query->failed()->count();

        return [
            'total' => $total,
            'sent' => $sent,
            'delivered' => $delivered,
            'read' => $read,
            'failed' => $failed,
            'delivery_rate' => $sent > 0 ? round(($delivered / $sent) * 100, 2) : 0,
            'read_rate' => $delivered > 0 ? round(($read / $delivered) * 100, 2) : 0,
        ];
    }

    /**
     * Vérifier la configuration Twilio
     */
    public function testConnection(): array
    {
        try {
            $account = $this->twilioClient->api->accounts(config('services.twilio.sid'))->fetch();
            
            return [
                'success' => true,
                'account_name' => $account->friendlyName,
                'status' => $account->status,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}