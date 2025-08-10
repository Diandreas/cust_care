<?php

namespace App\Services;

use App\Models\Client;
use App\Models\Message;
use Twilio\Rest\Client as TwilioClient;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private TwilioClient $twilio;
    private string $fromNumber;

    public function __construct()
    {
        $this->twilio = new TwilioClient(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
        $this->fromNumber = 'whatsapp:' . config('services.twilio.whatsapp_number');
    }

    public function sendMessage(Client $client, string $content, ?int $userId = null): Message
    {
        try {
            $toNumber = 'whatsapp:' . $this->formatPhoneNumber($client->phone);
            
            $twilioMessage = $this->twilio->messages->create(
                $toNumber,
                [
                    'from' => $this->fromNumber,
                    'body' => $content
                ]
            );

            return Message::create([
                'user_id' => $userId,
                'client_id' => $client->id,
                'content' => $content,
                'status' => 'sent',
                'type' => 'whatsapp',
                'external_id' => $twilioMessage->sid,
                'sent_at' => now()
            ]);

        } catch (\Exception $e) {
            Log::error('WhatsApp message failed: ' . $e->getMessage());
            
            return Message::create([
                'user_id' => $userId,
                'client_id' => $client->id,
                'content' => $content,
                'status' => 'failed',
                'type' => 'whatsapp',
                'error_code' => $e->getMessage(),
                'sent_at' => now()
            ]);
        }
    }

    public function sendTemplateMessage(Client $client, string $templateName, array $parameters = [], ?int $userId = null): Message
    {
        try {
            $toNumber = 'whatsapp:' . $this->formatPhoneNumber($client->phone);
            
            $twilioMessage = $this->twilio->messages->create(
                $toNumber,
                [
                    'from' => $this->fromNumber,
                    'contentSid' => $templateName,
                    'contentVariables' => json_encode($parameters)
                ]
            );

            return Message::create([
                'user_id' => $userId,
                'client_id' => $client->id,
                'content' => "Template: $templateName",
                'status' => 'sent',
                'type' => 'whatsapp_template',
                'external_id' => $twilioMessage->sid,
                'sent_at' => now()
            ]);

        } catch (\Exception $e) {
            Log::error('WhatsApp template message failed: ' . $e->getMessage());
            
            return Message::create([
                'user_id' => $userId,
                'client_id' => $client->id,
                'content' => "Template: $templateName",
                'status' => 'failed',
                'type' => 'whatsapp_template',
                'error_code' => $e->getMessage(),
                'sent_at' => now()
            ]);
        }
    }

    public function sendBulkMessage(array $clientIds, string $content, ?int $userId = null): array
    {
        $results = [];
        $clients = Client::whereIn('id', $clientIds)->where('opt_out', false)->get();

        foreach ($clients as $client) {
            $results[] = $this->sendMessage($client, $content, $userId);
            
            // Délai pour éviter les limites de taux
            usleep(100000); // 100ms
        }

        return $results;
    }

    public function processIncomingMessage(array $webhookData): void
    {
        try {
            $fromNumber = str_replace('whatsapp:', '', $webhookData['From']);
            $content = $webhookData['Body'];
            $messageSid = $webhookData['MessageSid'];

            // Trouver ou créer le client
            $client = Client::where('phone', $this->formatPhoneNumber($fromNumber))->first();
            
            if (!$client) {
                $client = Client::create([
                    'phone' => $this->formatPhoneNumber($fromNumber),
                    'name' => 'Client WhatsApp',
                    'user_id' => 1 // À adapter selon votre logique
                ]);
            }

            // Enregistrer le message reçu
            Message::create([
                'client_id' => $client->id,
                'content' => $content,
                'status' => 'received',
                'type' => 'whatsapp',
                'is_reply' => true,
                'external_id' => $messageSid,
                'sent_at' => now()
            ]);

            // Déclencher le bot de réponse automatique si configuré
            $this->triggerAutomaticResponse($client, $content);

        } catch (\Exception $e) {
            Log::error('Error processing incoming WhatsApp message: ' . $e->getMessage());
        }
    }

    private function triggerAutomaticResponse(Client $client, string $incomingMessage): void
    {
        // Logique pour déclencher des réponses automatiques basées sur le contenu
        $lowercaseMessage = strtolower($incomingMessage);

        if (str_contains($lowercaseMessage, 'stop') || str_contains($lowercaseMessage, 'arrêt')) {
            $client->optOut();
            $this->sendMessage($client, "Vous avez été désinscrit de nos communications. Envoyez START pour vous réinscrire.");
        } elseif (str_contains($lowercaseMessage, 'start') || str_contains($lowercaseMessage, 'démarrer')) {
            $client->optIn();
            $this->sendMessage($client, "Vous avez été réinscrit à nos communications. Merci !");
        } elseif (str_contains($lowercaseMessage, 'info') || str_contains($lowercaseMessage, 'informations')) {
            $this->sendMessage($client, "Voici nos informations de contact et nos services...");
        }
    }

    private function formatPhoneNumber(string $phone): string
    {
        // Retirer tous les caractères non numériques
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Ajouter l'indicatif pays si manquant (adapter selon votre région)
        if (!str_starts_with($phone, '33') && !str_starts_with($phone, '+33')) {
            $phone = '33' . ltrim($phone, '0');
        }
        
        return '+' . ltrim($phone, '+');
    }

    public function getMessageStatus(string $messageSid): string
    {
        try {
            $message = $this->twilio->messages($messageSid)->fetch();
            return $message->status;
        } catch (\Exception $e) {
            Log::error('Error fetching WhatsApp message status: ' . $e->getMessage());
            return 'unknown';
        }
    }
}