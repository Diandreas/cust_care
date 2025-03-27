<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Channels\TwilioChannel;

class EventNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $event;
    protected $message;

    /**
     * Create a new notification instance.
     */
    public function __construct($event, $message = null)
    {
        $this->event = $event;
        $this->message = $message;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', TwilioChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Nouvel événement: ' . $this->event['title'])
            ->line('Un nouvel événement a été créé: ' . $this->event['title'])
            ->line('Date: ' . $this->event['date'])
            ->line('Lieu: ' . $this->event['location'])
            ->action('Voir l\'événement', url('/events/' . $this->event['id']))
            ->line('Merci d\'utiliser notre application!');
    }

    /**
     * Get the Twilio representation of the notification.
     */
    public function toTwilio(object $notifiable): string
    {
        if ($this->message) {
            return $this->message;
        }
        
        return 'Nouvel événement: ' . $this->event['title'] . ' le ' . $this->event['date'] . ' à ' . $this->event['location'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'event_id' => $this->event['id'],
            'title' => $this->event['title'],
            'message' => 'Un nouvel événement a été créé'
        ];
    }
}
