<?php

namespace App\Services;

use Twilio\TwiML\MessagingResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TwilioWebhookService
{
    /**
     * Traite un webhook de SMS entrant
     * 
     * @param Request $request
     * @return string
     */
    public function handleIncomingSms(Request $request)
    {
        $from = $request->input('From');
        $body = $request->input('Body');
        $numMedia = (int)$request->input('NumMedia', 0);
        
        // Journaliser le message entrant
        Log::info('SMS reçu', [
            'from' => $from,
            'body' => $body,
            'numMedia' => $numMedia
        ]);
        
        // Traiter le message selon son contenu
        $response = new MessagingResponse();
        
        // Exemple de réponse basée sur le contenu
        if (stripos($body, 'aide') !== false || stripos($body, 'help') !== false) {
            $response->message("Voici les commandes disponibles:\n- AIDE: Afficher cette aide\n- INFO: Informations sur votre compte\n- STOP: Se désabonner");
        } elseif (stripos($body, 'info') !== false) {
            $response->message("Votre numéro est: $from");
        } else {
            $response->message("Merci pour votre message. Notre équipe vous répondra bientôt.");
        }
        
        return $response->asXML();
    }
    
    /**
     * Traite un webhook de statut de message
     * 
     * @param Request $request
     * @return string
     */
    public function handleMessageStatus(Request $request)
    {
        $messageSid = $request->input('MessageSid');
        $messageStatus = $request->input('MessageStatus');
        
        // Journaliser le changement de statut
        Log::info('Statut de message mis à jour', [
            'messageSid' => $messageSid,
            'status' => $messageStatus
        ]);
        
        // Ici, vous pourriez mettre à jour le statut dans votre base de données
        // Par exemple: Message::where('twilio_sid', $messageSid)->update(['status' => $messageStatus]);
        
        return response('OK', 200);
    }
    
    /**
     * Traite un webhook de WhatsApp entrant
     * 
     * @param Request $request
     * @return string
     */
    public function handleIncomingWhatsApp(Request $request)
    {
        $from = $request->input('From');
        $body = $request->input('Body');
        
        // Retirer le préfixe "whatsapp:" du numéro
        $from = str_replace('whatsapp:', '', $from);
        
        // Journaliser le message entrant
        Log::info('WhatsApp reçu', [
            'from' => $from,
            'body' => $body
        ]);
        
        // Traiter le message selon son contenu
        $response = new MessagingResponse();
        $response->message("Merci d'avoir contacté notre service via WhatsApp. Nous vous répondrons dans les plus brefs délais.");
        
        return $response->asXML();
    }
} 