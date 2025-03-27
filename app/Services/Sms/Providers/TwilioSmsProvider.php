<?php

namespace App\Services\Sms\Providers;

use App\Services\Sms\SmsProviderInterface;
use App\Services\SmsResult;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TwilioSmsProvider implements SmsProviderInterface
{
    protected $accountSid;
    protected $authToken;
    protected $fromNumber;
    protected $apiUrl = 'https://api.twilio.com/2010-04-01';

    /**
     * Constructor
     */
    public function __construct(string $accountSid, string $authToken, string $fromNumber = null)
    {
        $this->accountSid = $accountSid;
        $this->authToken = $authToken;
        $this->fromNumber = $fromNumber ?? config('services.twilio.from_number');
    }

    /**
     * Envoyer un message SMS via Twilio
     */
    public function send(string $phone, string $message): SmsResult
    {
        try {
            $response = Http::withBasicAuth($this->accountSid, $this->authToken)
                ->asForm()
                ->post("{$this->apiUrl}/Accounts/{$this->accountSid}/Messages.json", [
                    'To' => $phone,
                    'From' => $this->fromNumber,
                    'Body' => $message
                ]);

            if ($response->successful()) {
                $data = $response->json();
                return new SmsResult(
                    true,
                    $data['sid'] ?? null
                );
            }

            Log::error('Échec d\'envoi SMS via Twilio', [
                'status' => $response->status(),
                'body' => $response->body(),
                'to' => $phone
            ]);

            return new SmsResult(
                false,
                null,
                $response->json('message') ?? 'Erreur Twilio inconnue'
            );
        } catch (\Exception $e) {
            Log::error('Exception lors de l\'envoi SMS via Twilio', [
                'error' => $e->getMessage(),
                'to' => $phone
            ]);

            return new SmsResult(false, null, $e->getMessage());
        }
    }

    /**
     * Envoyer plusieurs messages en lot
     */
    public function sendBatch(array $messages): array
    {
        $results = [
            'success' => [],
            'failed' => []
        ];

        // Twilio n'a pas d'API d'envoi en masse native, nous traitons donc les messages individuellement
        foreach ($messages as $index => $message) {
            $result = $this->send($message['to'], $message['content']);
            
            if ($result->isSuccess()) {
                $results['success'][$index] = [
                    'message_id' => $result->getMessageId(),
                    'client_id' => $message['client_id'] ?? null
                ];
            } else {
                $results['failed'][$index] = [
                    'error' => $result->getError(),
                    'client_id' => $message['client_id'] ?? null
                ];
            }
        }

        return $results;
    }

    /**
     * Obtenir le statut de livraison d'un message
     */
    public function getDeliveryStatus(string $messageId): string
    {
        try {
            $response = Http::withBasicAuth($this->accountSid, $this->authToken)
                ->get("{$this->apiUrl}/Accounts/{$this->accountSid}/Messages/{$messageId}.json");

            if ($response->successful()) {
                $status = $response->json('status');
                
                // Mapper les statuts Twilio aux statuts de notre application
                switch ($status) {
                    case 'delivered':
                        return 'delivered';
                    case 'failed':
                    case 'undelivered':
                        return 'failed';
                    case 'sent':
                        return 'sent';
                    case 'queued':
                    case 'sending':
                    case 'accepted':
                        return 'pending';
                    default:
                        return 'unknown';
                }
            }
            
            Log::error('Échec de récupération du statut SMS via Twilio', [
                'status' => $response->status(),
                'body' => $response->body(),
                'message_id' => $messageId
            ]);
            
            return 'unknown';
        } catch (\Exception $e) {
            Log::error('Exception lors de la récupération du statut SMS via Twilio', [
                'error' => $e->getMessage(),
                'message_id' => $messageId
            ]);
            
            return 'unknown';
        }
    }
} 