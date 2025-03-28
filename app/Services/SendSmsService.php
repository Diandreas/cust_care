<?php

namespace App\Services;

use Twilio\Rest\Client;
use Illuminate\Support\Facades\Log;
use App\Models\TwilioMessage;
use Illuminate\Support\Facades\Auth;

class SendSmsService
{
    /**
     * Envoyer un SMS simple avec Twilio et l'enregistrer en base de données
     *
     * @param string $to Numéro de téléphone du destinataire
     * @param string $message Contenu du message
     * @param string|null $statusCallback URL de callback pour les statuts (optionnel)
     * @return array Résultat de l'envoi
     */
    public function send($to, $message, $statusCallback = null)
    {
        try {
            // Récupérer les informations d'API de la configuration
            $accountSid = config('services.twilio.sid');
            $authToken = config('services.twilio.token');
            $twilioNumber = config('services.twilio.number');

            // Vérifier que les informations sont configurées
            if (empty($accountSid) || empty($authToken) || empty($twilioNumber)) {
                throw new \Exception('Les informations d\'API Twilio ne sont pas configurées');
            }

            // Créer l'enregistrement en base de données
            $twilioMessage = new TwilioMessage([
                'user_id' => Auth::id(),
                'from' => $twilioNumber,
                'to' => $to,
                'body' => $message,
                'status' => 'queued'
            ]);
            $twilioMessage->save();

            // Initialiser le client Twilio
            $client = new Client($accountSid, $authToken);
            
            // Préparer les paramètres du message
            $messageParams = [
                'from' => $twilioNumber,
                'body' => $message
            ];
            
            // Ajouter l'URL de callback si fournie
            if ($statusCallback) {
                $messageParams['statusCallback'] = $statusCallback;
            }
            
            // Envoyer le message
            $twilioResponse = $client->messages->create($to, $messageParams);
            
            // Mettre à jour l'enregistrement avec le SID et le statut
            $twilioMessage->update([
                'twilio_sid' => $twilioResponse->sid,
                'status' => $twilioResponse->status
            ]);
            
            // Journaliser l'envoi
            Log::info('SMS envoyé avec succès', [
                'to' => $to, 
                'sid' => $twilioResponse->sid
            ]);
            
            return [
                'success' => true,
                'sid' => $twilioResponse->sid,
                'status' => $twilioResponse->status,
                'message_id' => $twilioMessage->id
            ];
        } catch (\Exception $e) {
            // Enregistrer l'erreur si l'enregistrement a été créé
            if (isset($twilioMessage)) {
                $twilioMessage->update([
                    'status' => 'failed',
                    'error_info' => ['message' => $e->getMessage(), 'code' => $e->getCode()]
                ]);
            }
            
            // Journaliser l'erreur
            Log::error('Erreur lors de l\'envoi du SMS', [
                'to' => $to,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
} 