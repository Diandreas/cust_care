<?php

namespace App\Services;

use Twilio\Rest\Client;

class TwilioService
{
    protected $client;
    
    public function __construct()
    {
        $this->client = new Client(
            config('services.twilio.sid'),
            config('services.twilio.token')
        );
    }
    
    /**
     * Envoyer un SMS via Twilio
     * 
     * @param string $to Le numéro du destinataire
     * @param string $message Le contenu du message
     * @return \Twilio\Rest\Api\V2010\Account\MessageInstance
     */
    public function sendSMS($to, $message)
    {
        return $this->client->messages->create($to, [
            'from' => config('services.twilio.number'),
            'body' => $message
        ]);
    }
    
    /**
     * Envoyer un message WhatsApp via Twilio
     * 
     * @param string $to Le numéro du destinataire
     * @param string $message Le contenu du message
     * @return \Twilio\Rest\Api\V2010\Account\MessageInstance
     */
    public function sendWhatsApp($to, $message)
    {
        return $this->client->messages->create("whatsapp:$to", [
            'from' => "whatsapp:" . config('services.twilio.whatsapp_number'),
            'body' => $message
        ]);
    }
} 