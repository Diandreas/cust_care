<?php

namespace App\Channels;

use Illuminate\Notifications\Notification;
use App\Services\TwilioService;

class TwilioChannel
{
    protected $twilioService;
    
    public function __construct(TwilioService $twilioService)
    {
        $this->twilioService = $twilioService;
    }
    
    /**
     * Envoyer la notification via Twilio
     *
     * @param mixed $notifiable
     * @param \Illuminate\Notifications\Notification $notification
     * @return void
     */
    public function send($notifiable, Notification $notification)
    {
        if (!method_exists($notification, 'toTwilio')) {
            return;
        }
        
        // Obtenir les données de la notification
        $message = $notification->toTwilio($notifiable);
        
        // Vérifier si le destinataire a un numéro de téléphone
        if (!$notifiable->routeNotificationFor('twilio')) {
            return;
        }
        
        // Envoyer le SMS
        $this->twilioService->sendSMS(
            $notifiable->routeNotificationFor('twilio'),
            $message
        );
    }
} 