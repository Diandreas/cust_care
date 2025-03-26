<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SmsService
{
    protected $apiKey;
    protected $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.sms.api_key');
        $this->apiUrl = config('services.sms.api_url');
    }

    public function send(string $phoneNumber, string $message): SmsResult
    {
        try {
            // Simulation d'intégration avec un service SMS externe
            // Dans une implémentation réelle, utilisez Http::withToken() de Laravel 12
            $response = Http::withToken($this->apiKey)
                ->post($this->apiUrl, [
                    'to' => $phoneNumber,
                    'message' => $message
                ]);

            if ($response->successful()) {
                return new SmsResult(true, $response->json('message_id'));
            }

            return new SmsResult(false, null, $response->json('error'));
        } catch (\Exception $e) {
            return new SmsResult(false, null, $e->getMessage());
        }
    }
}

class SmsResult
{
    protected $success;
    protected $messageId;
    protected $error;

    public function __construct(bool $success, ?string $messageId = null, ?string $error = null)
    {
        $this->success = $success;
        $this->messageId = $messageId;
        $this->error = $error;
    }

    public function isSuccess(): bool
    {
        return $this->success;
    }

    public function getMessageId(): ?string
    {
        return $this->messageId;
    }

    public function getError(): ?string
    {
        return $this->error;
    }
}
