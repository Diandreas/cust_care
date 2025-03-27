<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\TwilioService;
use App\Services\CampaignService;
use App\Notifications\EventNotification;
use App\Models\User;

class ExampleController extends Controller
{
    protected $twilioService;
    protected $campaignService;
    
    public function __construct(TwilioService $twilioService, CampaignService $campaignService)
    {
        $this->twilioService = $twilioService;
        $this->campaignService = $campaignService;
    }
    
    /**
     * Envoyer un SMS simple
     */
    public function sendSMS(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string',
            'message' => 'required|string'
        ]);
        
        try {
            $result = $this->twilioService->sendSMS(
                $request->phone_number,
                $request->message
            );
            
            return response()->json([
                'success' => true,
                'message' => 'SMS envoyé avec succès',
                'sid' => $result->sid
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Échec de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Envoyer un message WhatsApp
     */
    public function sendWhatsApp(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string',
            'message' => 'required|string'
        ]);
        
        try {
            $result = $this->twilioService->sendWhatsApp(
                $request->phone_number,
                $request->message
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Message WhatsApp envoyé avec succès',
                'sid' => $result->sid
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Échec de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Envoyer une notification d'événement
     */
    public function notifyEvent(Request $request)
    {
        $request->validate([
            'event_id' => 'required|integer',
            'user_id' => 'required|integer'
        ]);
        
        $user = User::findOrFail($request->user_id);
        $event = [
            'id' => $request->event_id,
            'title' => 'Titre de l\'événement',
            'date' => '2023-08-15',
            'location' => 'Paris, France'
        ];
        
        // Envoyer la notification
        $user->notify(new EventNotification($event));
        
        return response()->json([
            'success' => true,
            'message' => 'Notification envoyée avec succès'
        ]);
    }
    
    /**
     * Envoyer une campagne par email
     */
    public function sendEmailCampaign(Request $request)
    {
        $campaign = [
            'from_email' => 'votre-email@exemple.com',
            'from_name' => 'Nom de la Campagne',
            'subject' => 'Objet de la campagne',
            'content' => '<h1>Contenu de la campagne</h1><p>Bonjour {first_name},</p><p>Voici notre message.</p>'
        ];
        
        $recipients = [
            [
                'email' => 'destinataire@exemple.com',
                'name' => 'Nom Destinataire',
                'first_name' => 'Prénom'
            ]
        ];
        
        try {
            $response = $this->campaignService->sendEmailCampaign($campaign, $recipients);
            
            return response()->json([
                'success' => true,
                'message' => 'Campagne email envoyée avec succès',
                'status_code' => $response->statusCode()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Échec de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Envoyer une campagne par SMS
     */
    public function sendSMSCampaign(Request $request)
    {
        $campaign = [
            'content' => 'Bonjour {first_name}, voici notre message pour la campagne.'
        ];
        
        $recipients = [
            [
                'phone_number' => '+33612345678',
                'name' => 'Nom Destinataire',
                'first_name' => 'Prénom'
            ]
        ];
        
        try {
            $results = $this->campaignService->sendSMSCampaign($campaign, $recipients);
            
            return response()->json([
                'success' => true,
                'message' => 'Campagne SMS envoyée avec succès',
                'results' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Échec de l\'envoi: ' . $e->getMessage()
            ], 500);
        }
    }
} 