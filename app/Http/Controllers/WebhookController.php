<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TwilioService;
use App\Models\TwilioMessage;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    protected $twilioService;
    
    public function __construct(TwilioService $twilioService)
    {
        $this->twilioService = $twilioService;
    }
    
    /**
     * Envoie un SMS à un destinataire
     */
    public function sendSms(Request $request)
    {
        $request->validate([
            'to' => 'required|string',
            'message' => 'required|string'
        ]);
        
        try {
            // Envoyer le SMS via le service Twilio
            $result = $this->twilioService->sendSMS(
                $request->to,
                $request->message
            );
            
            // Enregistrer le message dans la base de données
            TwilioMessage::create([
                'user_id' => $request->user() ? $request->user()->id : null,
                'twilio_sid' => $result->sid,
                'from' => config('services.twilio.number'),
                'to' => $request->to,
                'body' => $request->message,
                'status' => $result->status
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'SMS envoyé avec succès',
                'sid' => $result->sid
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi du SMS', [
                'to' => $request->to,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Échec de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Envoie un message WhatsApp à un destinataire
     */
    public function sendWhatsApp(Request $request)
    {
        $request->validate([
            'to' => 'required|string',
            'message' => 'required|string'
        ]);
        
        try {
            // Envoyer le message WhatsApp via le service Twilio
            $result = $this->twilioService->sendWhatsApp(
                $request->to,
                $request->message
            );
            
            // Enregistrer le message dans la base de données
            TwilioMessage::create([
                'user_id' => $request->user() ? $request->user()->id : null,
                'twilio_sid' => $result->sid,
                'from' => "whatsapp:" . config('services.twilio.whatsapp_number'),
                'to' => "whatsapp:" . $request->to,
                'body' => $request->message,
                'status' => $result->status,
                'direction' => 'outbound-api'
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Message WhatsApp envoyé avec succès',
                'sid' => $result->sid
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi du message WhatsApp', [
                'to' => $request->to,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Échec de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }
}
