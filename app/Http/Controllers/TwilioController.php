<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Twilio\Rest\Client as TwilioClient;
use Twilio\TwiML\MessagingResponse;
use Twilio\TwiML\VoiceResponse;
use SendGrid\Mail\Mail as SendGridMail;
use Carbon\Carbon;
use App\Models\Campaign;
use App\Models\Client as ClientModel;
use App\Models\User;
use Exception;

class TwilioController extends Controller
{
    protected $twilio;
    
    public function __construct()
    {
        $this->twilio = new TwilioClient(
            config('services.twilio.sid'), 
            config('services.twilio.token')
        );
    }

    /**
     * Webhook pour recevoir les SMS entrants
     */
    public function receiveSMS(Request $request)
    {
        try {
            $from = $request->input('From');
            $body = trim($request->input('Body'));
            $to = $request->input('To');
            
            Log::info('SMS reçu', ['from' => $from, 'body' => $body, 'to' => $to]);
            
            // Rechercher le client par numéro de téléphone
            $client = ClientModel::where('phone', $from)->first();
            
            // Traitement intelligent avec IA
            $response = $this->processIncomingMessage($body, $client, 'sms');
            
            // Créer la réponse TwiML
            $twiml = new MessagingResponse();
            $message = $twiml->message($response['message']);
            
            // Ajouter des médias si disponibles
            if (isset($response['media_url'])) {
                $message->media($response['media_url']);
            }
            
            // Log de la réponse
            $this->logCommunication($from, $to, $body, $response['message'], 'sms', 'inbound');
            
            return response($twiml)->header('Content-Type', 'text/xml');
            
        } catch (Exception $e) {
            Log::error('Erreur réception SMS', ['error' => $e->getMessage()]);
            
            $twiml = new MessagingResponse();
            $twiml->message("Désolé, une erreur s'est produite. Veuillez réessayer plus tard.");
            
            return response($twiml)->header('Content-Type', 'text/xml');
        }
    }

    /**
     * Webhook pour recevoir les messages WhatsApp entrants
     */
    public function receiveWhatsApp(Request $request)
    {
        try {
            $from = $request->input('From');
            $body = trim($request->input('Body'));
            $to = $request->input('To');
            $numMedia = (int) $request->input('NumMedia', 0);
            
            Log::info('WhatsApp reçu', ['from' => $from, 'body' => $body, 'to' => $to, 'media' => $numMedia]);
            
            // Extraire le numéro de téléphone du format WhatsApp
            $phoneNumber = str_replace('whatsapp:', '', $from);
            $client = ClientModel::where('phone', $phoneNumber)->first();
            
            // Traitement intelligent avec IA
            $response = $this->processIncomingMessage($body, $client, 'whatsapp');
            
            // Créer la réponse TwiML
            $twiml = new MessagingResponse();
            $message = $twiml->message($response['message']);
            
            // Ajouter des médias si disponibles
            if (isset($response['media_url'])) {
                $message->media($response['media_url']);
            }
            
            // Log de la communication
            $this->logCommunication($from, $to, $body, $response['message'], 'whatsapp', 'inbound');
            
            return response($twiml)->header('Content-Type', 'text/xml');
            
        } catch (Exception $e) {
            Log::error('Erreur réception WhatsApp', ['error' => $e->getMessage()]);
            
            $twiml = new MessagingResponse();
            $twiml->message("Désolé, une erreur s'est produite. Veuillez réessayer plus tard.");
            
            return response($twiml)->header('Content-Type', 'text/xml');
        }
    }

    /**
     * Webhook pour recevoir les appels entrants
     */
    public function receiveCall(Request $request)
    {
        try {
            $from = $request->input('From');
            $to = $request->input('To');
            
            Log::info('Appel reçu', ['from' => $from, 'to' => $to]);
            
            // Rechercher le client
            $client = ClientModel::where('phone', $from)->first();
            
            // Créer la réponse TwiML pour l'appel
            $twiml = new VoiceResponse();
            
            if ($client) {
                $twiml->say("Bonjour {$client->first_name}, merci d'avoir appelé HelloBoost. Votre appel est important pour nous.", ['language' => 'fr-FR']);
            } else {
                $twiml->say("Bonjour et merci d'avoir appelé HelloBoost. Votre appel est important pour nous.", ['language' => 'fr-FR']);
            }
            
            // Menu vocal intelligent
            $gather = $twiml->gather(['numDigits' => 1, 'action' => route('twilio.voice.menu')]);
            $gather->say("Appuyez sur 1 pour les informations sur nos services, 2 pour le support technique, 3 pour parler à un conseiller, ou restez en ligne.", ['language' => 'fr-FR']);
            
            // Si pas de saisie, rediriger vers conseiller
            $twiml->redirect(route('twilio.voice.agent'));
            
            // Log de l'appel
            $this->logCommunication($from, $to, '', 'Appel reçu', 'voice', 'inbound');
            
            return response($twiml)->header('Content-Type', 'text/xml');
            
        } catch (Exception $e) {
            Log::error('Erreur réception appel', ['error' => $e->getMessage()]);
            
            $twiml = new VoiceResponse();
            $twiml->say("Désolé, un problème technique s'est produit. Veuillez rappeler plus tard.", ['language' => 'fr-FR']);
            
            return response($twiml)->header('Content-Type', 'text/xml');
        }
    }

    /**
     * Traitement intelligent des messages entrants avec IA
     */
    private function processIncomingMessage($message, $client, $channel)
    {
        $message = strtolower($message);
        
        // Mots-clés pour l'arrêt des communications
        $stopKeywords = ['stop', 'arret', 'arrêt', 'unsubscribe', 'désinscription'];
        if (in_array($message, $stopKeywords)) {
            if ($client) {
                $client->opt_out = true;
                $client->save();
            }
            return [
                'message' => "Vous avez été désinscrit de nos communications. Envoyez START pour vous réinscrire.",
                'action' => 'opt_out'
            ];
        }
        
        // Mots-clés pour la réinscription
        $startKeywords = ['start', 'début', 'oui', 'yes'];
        if (in_array($message, $startKeywords)) {
            if ($client) {
                $client->opt_out = false;
                $client->save();
            }
            return [
                'message' => "Vous êtes maintenant réinscrit à nos communications. Merci !",
                'action' => 'opt_in'
            ];
        }
        
        // Analyse intelligente du contenu avec IA simulée
        $aiResponse = $this->analyzeMessageWithAI($message, $client, $channel);
        
        return $aiResponse;
    }

    /**
     * Analyse intelligente des messages avec IA (simulée)
     */
    private function analyzeMessageWithAI($message, $client, $channel)
    {
        // Mots-clés de service
        $serviceKeywords = [
            'prix' => 'Nos tarifs commencent à partir de 29€/mois. Visitez notre site pour plus d\'informations.',
            'info' => 'HelloBoost vous aide à gérer vos campagnes marketing. Besoin d\'aide spécifique ?',
            'aide' => 'Je suis là pour vous aider ! Que puis-je faire pour vous ?',
            'support' => 'Notre équipe support est disponible 24/7. Décrivez votre problème.',
            'campagne' => 'Voulez-vous créer une nouvelle campagne ? Je peux vous guider.',
            'rdv' => 'Souhaitez-vous prendre rendez-vous avec un conseiller ?'
        ];
        
        // Recherche de mots-clés
        foreach ($serviceKeywords as $keyword => $response) {
            if (strpos($message, $keyword) !== false) {
                return [
                    'message' => $response,
                    'action' => 'keyword_match',
                    'keyword' => $keyword
                ];
            }
        }
        
        // Détection de sentiment (simulation)
        $sentiment = $this->detectSentiment($message);
        
        if ($sentiment === 'negative') {
            return [
                'message' => "Je comprends votre préoccupation. Un conseiller va vous contacter rapidement pour résoudre votre problème.",
                'action' => 'escalate',
                'priority' => 'high'
            ];
        }
        
        if ($sentiment === 'positive') {
            return [
                'message' => "Merci pour votre retour positif ! N'hésitez pas si vous avez d'autres questions.",
                'action' => 'acknowledge'
            ];
        }
        
        // Réponse par défaut avec personnalisation
        $clientName = $client ? $client->first_name : 'Cher client';
        
        return [
            'message' => "Bonjour {$clientName} ! Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais. Pour une assistance immédiate, appelez-nous au 01 23 45 67 89.",
            'action' => 'default_response'
        ];
    }

    /**
     * Détection de sentiment (simulation simple)
     */
    private function detectSentiment($message)
    {
        $negativeWords = ['problème', 'bug', 'erreur', 'nul', 'mauvais', 'mécontent', 'insatisfait'];
        $positiveWords = ['merci', 'super', 'excellent', 'parfait', 'bravo', 'content', 'satisfait'];
        
        $negativeCount = 0;
        $positiveCount = 0;
        
        foreach ($negativeWords as $word) {
            if (strpos($message, $word) !== false) {
                $negativeCount++;
            }
        }
        
        foreach ($positiveWords as $word) {
            if (strpos($message, $word) !== false) {
                $positiveCount++;
            }
        }
        
        if ($negativeCount > $positiveCount) {
            return 'negative';
        } elseif ($positiveCount > $negativeCount) {
            return 'positive';
        }
        
        return 'neutral';
    }

    /**
     * Envoyer un SMS
     */
    public function sendSMS($to, $message, $from = null)
    {
        try {
            $from = $from ?: config('services.twilio.sms_from');
            
            $message = $this->twilio->messages->create($to, [
                'from' => $from,
                'body' => $message
            ]);
            
            $this->logCommunication($from, $to, $message->body, '', 'sms', 'outbound');
            
            return $message;
            
        } catch (Exception $e) {
            Log::error('Erreur envoi SMS', ['to' => $to, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Envoyer un message WhatsApp
     */
    public function sendWhatsApp($to, $message, $mediaUrl = null)
    {
        try {
            $from = 'whatsapp:' . config('services.twilio.whatsapp_from');
            $to = 'whatsapp:' . $to;
            
            $messageData = [
                'from' => $from,
                'body' => $message
            ];
            
            if ($mediaUrl) {
                $messageData['mediaUrl'] = $mediaUrl;
            }
            
            $message = $this->twilio->messages->create($to, $messageData);
            
            $this->logCommunication($from, $to, $message->body, '', 'whatsapp', 'outbound');
            
            return $message;
            
        } catch (Exception $e) {
            Log::error('Erreur envoi WhatsApp', ['to' => $to, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Passer un appel vocal
     */
    public function makeCall($to, $twimlUrl, $from = null)
    {
        try {
            $from = $from ?: config('services.twilio.voice_from');
            
            $call = $this->twilio->calls->create($to, $from, [
                'url' => $twimlUrl
            ]);
            
            $this->logCommunication($from, $to, '', 'Appel sortant', 'voice', 'outbound');
            
            return $call;
            
        } catch (Exception $e) {
            Log::error('Erreur appel vocal', ['to' => $to, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Envoyer un email via SendGrid
     */
    public function sendEmail($to, $subject, $content, $from = null)
    {
        try {
            $from = $from ?: config('services.twilio.email_from');
            
            // Utilisation de SendGrid via Twilio
            $email = new \SendGrid\Mail\Mail();
            $email->setFrom($from, config('app.name'));
            $email->setSubject($subject);
            $email->addTo($to);
            $email->addContent("text/html", $content);
            
            $sendgrid = new \SendGrid(config('services.twilio.sendgrid_api_key'));
            $response = $sendgrid->send($email);
            
            $this->logCommunication($from, $to, $subject, $content, 'email', 'outbound');
            
            return $response;
            
        } catch (Exception $e) {
            Log::error('Erreur envoi email', ['to' => $to, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Automatisation des campagnes avec IA
     */
    public function automateCampaign(Campaign $campaign)
    {
        try {
            // Analyse de la campagne avec IA
            $aiAnalysis = $this->analyzeCampaignWithAI($campaign);
            
            // Optimisation du timing
            $optimalTime = $this->calculateOptimalSendTime($campaign);
            
            // Personnalisation des messages
            $personalizedMessages = $this->personalizeMessages($campaign);
            
            // Segmentation intelligente
            $segments = $this->intelligentSegmentation($campaign);
            
            // Planification automatique
            foreach ($segments as $segment) {
                $this->scheduleSegmentDelivery($campaign, $segment, $optimalTime);
            }
            
            return [
                'status' => 'success',
                'analysis' => $aiAnalysis,
                'optimal_time' => $optimalTime,
                'segments' => count($segments)
            ];
            
        } catch (Exception $e) {
            Log::error('Erreur automatisation campagne', ['campaign_id' => $campaign->id, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Analyse de campagne avec IA (simulée)
     */
    private function analyzeCampaignWithAI(Campaign $campaign)
    {
        // Simulation d'analyse IA
        $analysis = [
            'engagement_prediction' => rand(60, 95) . '%',
            'optimal_channels' => ['sms', 'whatsapp', 'email'],
            'recommended_time' => Carbon::now()->addHours(2)->format('H:i'),
            'audience_insights' => [
                'size' => $campaign->recipients_count,
                'demographics' => 'Mixed audience',
                'engagement_history' => 'Good'
            ]
        ];
        
        return $analysis;
    }

    /**
     * Calcul du moment optimal d'envoi
     */
    private function calculateOptimalSendTime(Campaign $campaign)
    {
        // Analyse des données historiques pour trouver le meilleur moment
        $historicalData = DB::table('communication_logs')
            ->where('channel', $campaign->channel ?? 'sms')
            ->where('direction', 'outbound')
            ->whereNotNull('response_time')
            ->select(DB::raw('HOUR(created_at) as hour'), DB::raw('AVG(response_time) as avg_response'))
            ->groupBy('hour')
            ->orderBy('avg_response')
            ->first();
        
        $optimalHour = $historicalData ? $historicalData->hour : 14; // 14h par défaut
        
        return Carbon::today()->setHour($optimalHour);
    }

    /**
     * Personnalisation intelligente des messages
     */
    private function personalizeMessages(Campaign $campaign)
    {
        $clients = $campaign->recipients;
        $personalizedMessages = [];
        
        foreach ($clients as $client) {
            $message = $campaign->message_content;
            
            // Remplacement des variables
            $message = str_replace('{first_name}', $client->first_name, $message);
            $message = str_replace('{last_name}', $client->last_name, $message);
            $message = str_replace('{company}', $client->company, $message);
            
            // Personnalisation basée sur l'historique
            $lastInteraction = $this->getLastInteraction($client);
            if ($lastInteraction) {
                $message .= $this->addPersonalizedTouch($client, $lastInteraction);
            }
            
            $personalizedMessages[$client->id] = $message;
        }
        
        return $personalizedMessages;
    }

    /**
     * Segmentation intelligente de l'audience
     */
    private function intelligentSegmentation(Campaign $campaign)
    {
        $clients = $campaign->recipients;
        $segments = [];
        
        // Segmentation par engagement
        $highEngagement = $clients->filter(function ($client) {
            return $this->calculateEngagementScore($client) > 70;
        });
        
        $mediumEngagement = $clients->filter(function ($client) {
            $score = $this->calculateEngagementScore($client);
            return $score >= 40 && $score <= 70;
        });
        
        $lowEngagement = $clients->filter(function ($client) {
            return $this->calculateEngagementScore($client) < 40;
        });
        
        return [
            'high_engagement' => $highEngagement,
            'medium_engagement' => $mediumEngagement,
            'low_engagement' => $lowEngagement
        ];
    }

    /**
     * Calcul du score d'engagement
     */
    private function calculateEngagementScore($client)
    {
        $interactions = DB::table('communication_logs')
            ->where('client_phone', $client->phone)
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->count();
        
        $responses = DB::table('communication_logs')
            ->where('client_phone', $client->phone)
            ->where('direction', 'inbound')
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->count();
        
        return $interactions > 0 ? ($responses / $interactions) * 100 : 0;
    }

    /**
     * Gestion des numéros de téléphone disponibles
     */
    public function getAvailablePhoneNumbers($country = 'FR', $type = 'local')
    {
        try {
            $numbers = $this->twilio->availablePhoneNumbers($country)
                ->{$type}
                ->read(['limit' => 20]);
            
            return collect($numbers)->map(function ($number) {
                return [
                    'phone_number' => $number->phoneNumber,
                    'friendly_name' => $number->friendlyName,
                    'capabilities' => $number->capabilities,
                    'monthly_cost' => $this->getPhoneNumberPrice($number->phoneNumber)
                ];
            });
            
        } catch (Exception $e) {
            Log::error('Erreur récupération numéros disponibles', ['error' => $e->getMessage()]);
            return collect();
        }
    }

    /**
     * Acheter un numéro de téléphone
     */
    public function purchasePhoneNumber($phoneNumber, $user)
    {
        try {
            $incomingNumber = $this->twilio->incomingPhoneNumbers->create([
                'phoneNumber' => $phoneNumber,
                'smsUrl' => route('twilio.sms.receive'),
                'smsMethod' => 'POST',
                'voiceUrl' => route('twilio.voice.receive'),
                'voiceMethod' => 'POST'
            ]);
            
            // Enregistrer le numéro dans la base de données
            DB::table('user_phone_numbers')->insert([
                'user_id' => $user->id,
                'phone_number' => $phoneNumber,
                'twilio_sid' => $incomingNumber->sid,
                'monthly_cost' => $this->getPhoneNumberPrice($phoneNumber),
                'purchased_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            return $incomingNumber;
            
        } catch (Exception $e) {
            Log::error('Erreur achat numéro', ['phone' => $phoneNumber, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Obtenir le prix d'un numéro de téléphone
     */
    private function getPhoneNumberPrice($phoneNumber)
    {
        try {
            // Prix par défaut selon le type de numéro
            if (strpos($phoneNumber, '+33') === 0) {
                return 1.00; // Prix pour numéros français
            }
            return 1.50; // Prix par défaut
            
        } catch (Exception $e) {
            return 1.00; // Prix de fallback
        }
    }


    /**
     * Obtenir la dernière interaction avec un client
     */
    private function getLastInteraction($client)
    {
        return DB::table('communication_logs')
            ->where(function ($query) use ($client) {
                $query->where('from', $client->phone)
                      ->orWhere('to', $client->phone);
            })
            ->orderBy('created_at', 'desc')
            ->first();
    }

    /**
     * Ajouter une touche personnalisée basée sur l'historique
     */
    private function addPersonalizedTouch($client, $lastInteraction)
    {
        $daysSinceLastContact = Carbon::parse($lastInteraction->created_at)->diffInDays(now());
        
        if ($daysSinceLastContact > 30) {
            return "\n\nCela fait un moment que nous ne nous sommes pas parlé ! Comment allez-vous ?";
        } elseif ($daysSinceLastContact > 7) {
            return "\n\nJ'espère que tout se passe bien depuis notre dernier échange.";
        }
        
        return "";
    }

    /**
     * Planifier l'envoi d'un segment
     */
    private function scheduleSegmentDelivery($campaign, $segment, $optimalTime)
    {
        // Logique de planification différée selon le segment
        // Implementation dépendante du système de queue Laravel
    }

    /**
     * Traitement des sélections du menu vocal
     */
    public function handleVoiceMenu(Request $request)
    {
        try {
            $digits = $request->input('Digits');
            $twiml = new VoiceResponse();
            
            switch ($digits) {
                case '1': // Informations services
                    $twiml->say("HelloBoost propose des services de messagerie automatisée via SMS, WhatsApp et appels vocaux. Notre plateforme permet d'automatiser vos campagnes marketing et le service client grâce à l'intelligence artificielle.", ['language' => 'fr-FR']);
                    $twiml->redirect(route('twilio.voice.menu'));
                    break;
                    
                case '2': // Support technique
                    $twiml->say("Notre équipe technique est disponible du lundi au vendredi de 9h à 18h. Un technicien va prendre votre appel.", ['language' => 'fr-FR']);
                    $twiml->dial(config('services.twilio.support_number'), ['callerId' => config('services.twilio.caller_id')]);
                    break;
                    
                case '3': // Parler à un conseiller
                    $twiml->redirect(route('twilio.voice.agent'));
                    break;
                    
                default:
                    $twiml->say("Option non reconnue. Veuillez réessayer.", ['language' => 'fr-FR']);
                    $twiml->redirect(route('twilio.voice.menu'));
                    break;
            }
            
            return response($twiml)->header('Content-Type', 'text/xml');
            
        } catch (Exception $e) {
            Log::error('Erreur dans le menu vocal', ['error' => $e->getMessage()]);
            
            $twiml = new VoiceResponse();
            $twiml->say("Une erreur s'est produite. Veuillez rappeler plus tard.", ['language' => 'fr-FR']);
            
            return response($twiml)->header('Content-Type', 'text/xml');
        }
    }
    
    /**
     * Redirection vers un agent
     */
    public function connectToAgent(Request $request)
    {
        try {
            $from = $request->input('From');
            $twiml = new VoiceResponse();
            
            $twiml->say("Nous vous connectons à l'un de nos conseillers. Votre appel est important pour nous.", ['language' => 'fr-FR']);
            $twiml->dial(config('services.twilio.agent_number'), [
                'callerId' => config('services.twilio.caller_id'),
                'timeout' => 30,
                'record' => 'record-from-answer',
            ]);
            
            // Fallback si personne ne répond
            $twiml->say("Tous nos conseillers sont actuellement occupés. Nous vous invitons à laisser un message après le bip.", ['language' => 'fr-FR']);
            $twiml->record([
                'maxLength' => 120,
                'action' => route('twilio.voice.recording'),
                'transcribe' => true,
                'transcribeCallback' => route('twilio.voice.transcription'),
            ]);
            
            return response($twiml)->header('Content-Type', 'text/xml');
            
        } catch (Exception $e) {
            Log::error('Erreur connexion agent', ['error' => $e->getMessage()]);
            
            $twiml = new VoiceResponse();
            $twiml->say("Une erreur s'est produite. Veuillez rappeler plus tard.", ['language' => 'fr-FR']);
            
            return response($twiml)->header('Content-Type', 'text/xml');
        }
    }
    
    /**
     * Traitement des enregistrements vocaux
     */
    public function handleRecording(Request $request)
    {
        try {
            $recordingUrl = $request->input('RecordingUrl');
            $from = $request->input('From');
            $duration = $request->input('RecordingDuration');
            
            // Enregistrer les informations
            Log::info('Message vocal reçu', [
                'from' => $from, 
                'duration' => $duration,
                'url' => $recordingUrl
            ]);
            
            $twiml = new VoiceResponse();
            $twiml->say("Merci pour votre message. Un conseiller vous rappellera dans les plus brefs délais. Au revoir.", ['language' => 'fr-FR']);
            $twiml->hangup();
            
            return response($twiml)->header('Content-Type', 'text/xml');
            
        } catch (Exception $e) {
            Log::error('Erreur traitement enregistrement', ['error' => $e->getMessage()]);
            
            $twiml = new VoiceResponse();
            $twiml->say("Une erreur s'est produite. Votre message n'a pas pu être enregistré.", ['language' => 'fr-FR']);
            
            return response($twiml)->header('Content-Type', 'text/xml');
        }
    }
    
    /**
     * Traitement des transcriptions vocales
     */
    public function handleTranscription(Request $request)
    {
        try {
            $transcriptionText = $request->input('TranscriptionText');
            $recordingSid = $request->input('RecordingSid');
            $from = $request->input('From');
            
            if ($transcriptionText) {
                // Traitement intelligent avec IA
                $response = $this->processIncomingMessage($transcriptionText, null, 'voice');
                
                // Envoyer une notification aux agents
                // $this->notifyAgents($from, $transcriptionText, $response, 'voice');
                
                // Enregistrer la transcription
                $this->logCommunication($from, null, $transcriptionText, null, 'voice_transcription', 'inbound');
            }
            
            return response('OK');
            
        } catch (Exception $e) {
            Log::error('Erreur traitement transcription', ['error' => $e->getMessage()]);
            return response('Error', 500);
        }
    }
    
    /**
     * Envoi de SMS
     */
  
    
    /**
     * TwiML pour appel sortant
     */
    public function handleOutboundCall(Request $request)
    {
        try {
            $message = $request->input('message');
            $message = $message ? urldecode($message) : "Bonjour, ceci est un message automatique de HelloBoost.";
            
            $twiml = new VoiceResponse();
            $twiml->say($message, ['language' => 'fr-FR']);
            $twiml->pause(['length' => 1]);
            
            // Options pour le destinataire
            $gather = $twiml->gather(['numDigits' => 1, 'action' => route('twilio.voice.outbound.action')]);
            $gather->say("Appuyez sur 1 pour être connecté à un conseiller, ou 2 pour terminer l'appel.", ['language' => 'fr-FR']);
            
            // Timeout handler
            $twiml->say("Nous n'avons pas reçu de réponse. L'appel va maintenant se terminer. Au revoir.", ['language' => 'fr-FR']);
            $twiml->hangup();
            
            return response($twiml)->header('Content-Type', 'text/xml');
            
        } catch (Exception $e) {
            Log::error('Erreur dans le TwiML sortant', ['error' => $e->getMessage()]);
            
            $twiml = new VoiceResponse();
            $twiml->say("Une erreur s'est produite. Veuillez nous excuser pour ce désagrément.", ['language' => 'fr-FR']);
            
            return response($twiml)->header('Content-Type', 'text/xml');
        }
    }
    
    /**
     * Action pour appel sortant
     */
    public function handleOutboundCallAction(Request $request)
    {
        try {
            $digits = $request->input('Digits');
            $twiml = new VoiceResponse();
            
            switch ($digits) {
                case '1': // Connecter à un conseiller
                    $twiml->say("Nous vous connectons à l'un de nos conseillers. Veuillez patienter un instant.", ['language' => 'fr-FR']);
                    $twiml->dial(config('services.twilio.agent_number'), [
                        'callerId' => config('services.twilio.caller_id'),
                        'timeout' => 30,
                    ]);
                    $twiml->say("Tous nos conseillers sont actuellement occupés. Au revoir.", ['language' => 'fr-FR']);
                    break;
                    
                case '2': // Terminer l'appel
                    $twiml->say("Merci de nous avoir écoutés. Au revoir.", ['language' => 'fr-FR']);
                    break;
                    
                default:
                    $twiml->say("Option non reconnue. L'appel va maintenant se terminer. Au revoir.", ['language' => 'fr-FR']);
                    break;
            }
            
            $twiml->hangup();
            
            return response($twiml)->header('Content-Type', 'text/xml');
            
        } catch (Exception $e) {
            Log::error('Erreur dans l\'action de l\'appel sortant', ['error' => $e->getMessage()]);
            
            $twiml = new VoiceResponse();
            $twiml->say("Une erreur s'est produite. Au revoir.", ['language' => 'fr-FR']);
            $twiml->hangup();
            
            return response($twiml)->header('Content-Type', 'text/xml');
        }
    }
    

    
    /**
     * Obtenir les numéros disponibles
     */

    /**
     * Obtenir les numéros de téléphone déjà achetés
     */
    public function getPurchasedPhoneNumbers()
    {
        try {
            $incomingNumbers = $this->twilio->incomingPhoneNumbers->read();
            $formattedNumbers = [];
            
            foreach ($incomingNumbers as $number) {
                $formattedNumbers[] = [
                    'phone_number' => $number->phoneNumber,
                    'friendly_name' => $number->friendlyName,
                    'sid' => $number->sid,
                    'capabilities' => [
                        'sms' => $number->capabilities['sms'],
                        'voice' => $number->capabilities['voice'],
                        'mms' => $number->capabilities['mms'],
                    ],
                    'date_created' => $number->dateCreated->format('Y-m-d H:i:s'),
                ];
            }
            
            return [
                'success' => true,
                'numbers' => $formattedNumbers,
            ];
            
        } catch (Exception $e) {
            Log::error('Erreur récupération numéros achetés', ['error' => $e->getMessage()]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
    

    /**
     * Récupérer le numéro par défaut pour les SMS
     */
    protected function getDefaultSmsNumber()
    {
        return config('services.twilio.default_sms_number');
    }
    
    /**
     * Récupérer le numéro par défaut pour WhatsApp
     */
    protected function getDefaultWhatsAppNumber()
    {
        return config('services.twilio.default_whatsapp_number');
    }
    
    /**
     * Récupérer le numéro par défaut pour les appels vocaux
     */
    protected function getDefaultVoiceNumber()
    {
        return config('services.twilio.default_voice_number');
    }
    
    /**
     * Enregistrer les communications dans la base de données
     */
    protected function logCommunication(
        $to, 
        $from, 
        $content, 
        $response, 
        $channel, 
        $direction,
        $external_id = null,
        $campaign_id = null
    ) {
        try {
            DB::table('communications')->insert([
                'to' => $to,
                'from' => $from,
                'content' => $content,
                'response' => $response,
                'channel' => $channel,
                'direction' => $direction,
                'external_id' => $external_id,
                'campaign_id' => $campaign_id,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        } catch (Exception $e) {
            Log::error('Erreur log communication', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Configure les identifiants Twilio
     */
    public function setCredentials($sid, $token)
    {
        if ($sid && $token) {
            $this->twilio = new TwilioClient($sid, $token);
            return true;
        }
        return false;
    }
    
    /**
     * Libère un numéro de téléphone
     */
    public function releasePhoneNumber($sid)
    {
        try {
            $this->twilio->incomingPhoneNumbers($sid)->delete();
            
            return [
                'success' => true,
            ];
            
        } catch (Exception $e) {
            Log::error('Erreur suppression numéro', ['error' => $e->getMessage(), 'sid' => $sid]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
} 