<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Twilio\Rest\Client as TwilioClient;
use Twilio\TwiML\MessagingResponse;
use Twilio\TwiML\VoiceResponse;
use Twilio\Exceptions\TwilioException;
use Carbon\Carbon;
use App\Models\Campaign;
use App\Models\Client as ClientModel;
use App\Models\Message;
use App\Models\User;
use App\Jobs\ProcessCampaignJob;
use App\Jobs\SendSmsJob;
use Exception;

class TwilioController extends Controller
{
    protected $twilio;

    public function __construct()
    {
        $this->twilio = new TwilioClient(
            config('services.twilio.sid'),
            config('services.twilio.auth_token')
        );
    }

    /**
     * ================================
     * GESTION DES CAMPAGNES SMS
     * ================================
     */

    /**
     * Créer et lancer une campagne SMS
     */
    public function createCampaign(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'message_content' => 'required|string|max:160',
            'client_ids' => 'required|array',
            'scheduled_at' => 'nullable|date|after:now',
            'send_immediately' => 'boolean'
        ]);

        try {
            $user = auth()->user();

            // Vérifier les quotas
            if (!$this->checkUserQuota($user, count($request->client_ids))) {
                return response()->json([
                    'error' => 'Quota SMS insuffisant pour cette campagne',
                    'quota_info' => $this->getUserQuotaInfo($user)
                ], 429);
            }

            // Créer la campagne
            $campaign = Campaign::create([
                'user_id' => $user->id,
                'name' => $request->name,
                'message_content' => $request->message_content,
                'recipients_count' => count($request->client_ids),
                'scheduled_at' => $request->scheduled_at,
                'status' => $request->send_immediately ? Campaign::STATUS_SENDING : Campaign::STATUS_SCHEDULED
            ]);

            // Attacher les destinataires
            $campaign->recipients()->attach($request->client_ids);

            if ($request->send_immediately) {
                $this->launchCampaign($campaign);
            }

            return response()->json([
                'success' => true,
                'campaign' => $campaign->load('recipients'),
                'message' => $request->send_immediately ? 'Campagne lancée' : 'Campagne programmée'
            ]);

        } catch (Exception $e) {
            Log::error('Erreur création campagne', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la création de la campagne'], 500);
        }
    }

    /**
     * Lancer une campagne (envoi immédiat ou programmé)
     */
    public function launchCampaign(Campaign $campaign)
    {
        try {
            $user = $campaign->user;

            // Vérifier l'heure d'envoi (conformité)
            if (!$this->isValidSendTime()) {
                $nextValidTime = $this->getNextValidSendTime();
                $campaign->update([
                    'scheduled_at' => $nextValidTime,
                    'status' => Campaign::STATUS_SCHEDULED
                ]);

                return response()->json([
                    'message' => 'Campagne reprogrammée à une heure autorisée',
                    'next_send_time' => $nextValidTime->format('d/m/Y H:i')
                ]);
            }

            $campaign->update(['status' => Campaign::STATUS_SENDING]);

            // Lancer la campagne via Job queue
            ProcessCampaignJob::dispatch($campaign);

            return response()->json([
                'success' => true,
                'message' => 'Campagne mise en file d\'attente pour envoi',
                'campaign_id' => $campaign->id
            ]);

        } catch (Exception $e) {
            Log::error('Erreur lancement campagne', ['campaign_id' => $campaign->id, 'error' => $e->getMessage()]);
            $campaign->update(['status' => Campaign::STATUS_FAILED]);

            return response()->json(['error' => 'Erreur lors du lancement de la campagne'], 500);
        }
    }

    /**
     * Traiter les messages d'une campagne (maintenant géré par ProcessCampaignJob)
     */
    // Cette méthode a été déplacée dans ProcessCampaignJob pour une meilleure séparation des responsabilités

    /**
     * ================================
     * GESTION DES NUMÉROS TWILIO
     * ================================
     */

    /**
     * Obtenir les numéros disponibles selon l'abonnement
     */
    public function getAvailableNumbers(Request $request)
    {
        try {
            $user = auth()->user();
            $subscription = $user->subscription;

            if (!$subscription) {
                return response()->json(['error' => 'Aucun abonnement actif'], 400);
            }

            $result = [];

            switch ($subscription->plan) {
                case 'starter':
                    $result = [
                        'type' => 'shared',
                        'message' => 'Votre plan utilise un numéro partagé géré automatiquement',
                        'numbers' => [],
                        'can_purchase' => false
                    ];
                    break;

                case 'business':
                case 'enterprise':
                    $availableNumbers = $this->twilio->availablePhoneNumbers("FR")
                        ->local
                        ->read(['limit' => 10]);

                    $formattedNumbers = [];
                    foreach ($availableNumbers as $number) {
                        $formattedNumbers[] = [
                            'phone_number' => $number->phoneNumber,
                            'friendly_name' => $number->friendlyName,
                            'capabilities' => [
                                'sms' => $number->capabilities['sms'],
                                'voice' => $number->capabilities['voice']
                            ],
                            'monthly_cost' => 1.00 // Prix en euros
                        ];
                    }

                    $result = [
                        'type' => 'dedicated',
                        'numbers' => $formattedNumbers,
                        'can_purchase' => true,
                        'current_numbers' => $this->getUserPhoneNumbers($user)
                    ];
                    break;
            }

            return response()->json($result);

        } catch (Exception $e) {
            Log::error('Erreur récupération numéros', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de la récupération des numéros'], 500);
        }
    }

    /**
     * Acheter un numéro de téléphone
     */
    public function purchaseNumber(Request $request)
    {
        $request->validate([
            'phone_number' => 'required|string'
        ]);

        try {
            $user = auth()->user();

            // Vérifier si l'utilisateur peut acheter des numéros
            if (!in_array($user->subscription->plan, ['business', 'enterprise'])) {
                return response()->json(['error' => 'Votre abonnement ne permet pas l\'achat de numéros dédiés'], 403);
            }

            $phoneNumber = $this->twilio->incomingPhoneNumbers->create([
                'phoneNumber' => $request->phone_number,
                'smsUrl' => route('twilio.sms.receive'),
                'smsMethod' => 'POST',
                'voiceUrl' => route('twilio.voice.receive'),
                'voiceMethod' => 'POST',
                'friendlyName' => "Numéro {$user->name}"
            ]);

            // Enregistrer dans la base
            DB::table('user_phone_numbers')->insert([
                'user_id' => $user->id,
                'phone_number' => $request->phone_number,
                'twilio_sid' => $phoneNumber->sid,
                'monthly_cost' => 1.00,
                'purchased_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Numéro acheté avec succès',
                'number' => [
                    'phone_number' => $phoneNumber->phoneNumber,
                    'sid' => $phoneNumber->sid
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Erreur achat numéro', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de l\'achat du numéro'], 500);
        }
    }

    /**
     * ================================
     * WEBHOOKS TWILIO
     * ================================
     */

    /**
     * Webhook pour SMS entrants
     */
    public function receiveSMS(Request $request)
    {
        try {
            $from = $request->input('From');
            $body = trim($request->input('Body'));
            $to = $request->input('To');
            $messageSid = $request->input('MessageSid');

            Log::info('SMS reçu', ['from' => $from, 'body' => $body, 'to' => $to]);

            // Rechercher le client
            $client = ClientModel::where('phone', $from)->first();

            // Traitement des mots-clés automatiques
            $response = new MessagingResponse();
            $messageText = strtoupper(trim($body));

            if (in_array($messageText, ['STOP', 'ARRET', 'UNSUBSCRIBE'])) {
                if ($client) {
                    $client->update(['opt_out' => true]);
                }
                $response->message("Vous avez été désinscrit. Répondez START pour vous réabonner.");
            }
            elseif (in_array($messageText, ['START', 'OUI', 'YES'])) {
                if ($client) {
                    $client->update(['opt_out' => false]);
                } else {
                    // Créer un nouveau client
                    $client = ClientModel::create([
                        'user_id' => 1, // À adapter selon votre logique
                        'phone' => $from,
                        'opt_out' => false
                    ]);
                }
                $response->message("Vous êtes maintenant réinscrit. Merci !");
            }
            elseif (in_array($messageText, ['AIDE', 'HELP', 'INFO'])) {
                $response->message("AIDE: Répondez STOP pour arrêter, START pour recommencer les messages.");
            }
            else {
                // Message personnalisé ou transfert vers un humain
                $response->message("Merci pour votre message. Notre équipe vous répondra rapidement. Pour une aide immédiate: 01 23 45 67 89");
            }

            // Enregistrer le message reçu
            if ($client) {
                Message::create([
                    'user_id' => $client->user_id,
                    'client_id' => $client->id,
                    'content' => $body,
                    'status' => 'received',
                    'type' => 'received',
                    'is_reply' => true,
                    'sent_at' => now()
                ]);
            }

            return response($response)->header('Content-Type', 'text/xml');

        } catch (Exception $e) {
            Log::error('Erreur réception SMS', ['error' => $e->getMessage()]);

            $response = new MessagingResponse();
            $response->message("Désolé, une erreur s'est produite. Veuillez réessayer plus tard.");

            return response($response)->header('Content-Type', 'text/xml');
        }
    }

    /**
     * Webhook pour statut des messages
     */
    public function statusCallback(Request $request)
    {
        try {
            $messageSid = $request->input('MessageSid');
            $messageStatus = $request->input('MessageStatus');
            $errorCode = $request->input('ErrorCode');

            // Mettre à jour le statut du message
            $message = Message::where('external_id', $messageSid)->first();

            if ($message) {
                $message->update([
                    'status' => $messageStatus,
                    'delivered_at' => in_array($messageStatus, ['delivered']) ? now() : null
                ]);

                // Mettre à jour les statistiques de campagne si applicable
                if ($message->campaign) {
                    $this->updateCampaignStats($message->campaign);
                }
            }

            Log::info('Status callback reçu', [
                'sid' => $messageSid,
                'status' => $messageStatus,
                'error' => $errorCode
            ]);

            return response('OK', 200);

        } catch (Exception $e) {
            Log::error('Erreur status callback', ['error' => $e->getMessage()]);
            return response('Error', 500);
        }
    }

    /**
     * ================================
     * FONCTIONS UTILITAIRES
     * ================================
     */

    /**
     * Vérifier les quotas utilisateur
     */
    private function checkUserQuota(User $user, int $messageCount): bool
    {
        $subscription = $user->subscription;
        if (!$subscription) return false;

        $quotas = config('services.twilio.quotas');
        $planQuota = $quotas[$subscription->plan]['sms_per_month'] ?? 0;

        $currentUsage = Message::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return ($currentUsage + $messageCount) <= $planQuota;
    }

    /**
     * Obtenir les informations de quota
     */
    private function getUserQuotaInfo(User $user): array
    {
        $subscription = $user->subscription;
        $quotas = config('services.twilio.quotas');
        $planQuota = $quotas[$subscription->plan]['sms_per_month'] ?? 0;

        $currentUsage = Message::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return [
            'plan' => $subscription->plan,
            'quota_total' => $planQuota,
            'quota_used' => $currentUsage,
            'quota_remaining' => max(0, $planQuota - $currentUsage),
            'percentage_used' => $planQuota > 0 ? round(($currentUsage / $planQuota) * 100, 2) : 0
        ];
    }

    /**
     * Obtenir le numéro d'envoi selon l'abonnement
     */
    private function getFromNumberForUser(User $user): string
    {
        $subscription = $user->subscription;

        if ($subscription->plan === 'starter') {
            // Numéro partagé par défaut
            return config('services.twilio.from_number');
        }

        // Chercher un numéro dédié
        $userNumber = DB::table('user_phone_numbers')
            ->where('user_id', $user->id)
            ->first();

        return $userNumber ? $userNumber->phone_number : config('services.twilio.from_number');
    }

    /**
     * Personnaliser le message avec les données client
     */
    private function personalizeMessage(string $template, ClientModel $client): string
    {
        $variables = [
            '{nom}' => $client->name ?? '',
            '{prenom}' => $client->first_name ?? '',
            '{entreprise}' => $client->company ?? '',
            '{date}' => now()->format('d/m/Y'),
            '{heure}' => now()->format('H:i')
        ];

        return str_replace(array_keys($variables), array_values($variables), $template);
    }

    /**
     * Vérifier si l'heure est valide pour l'envoi (conformité France)
     */
    private function isValidSendTime(): bool
    {
        $now = Carbon::now('Europe/Paris');

        // Pas d'envoi le weekend
        if ($now->isWeekend()) {
            return false;
        }

        $currentTime = $now->format('H:i');
        $config = config('services.twilio.allowed_hours');

        // Vérifier les heures autorisées (10h-13h et 14h-20h)
        return ($currentTime >= $config['start'] && $currentTime < $config['pause_start']) ||
            ($currentTime >= $config['pause_end'] && $currentTime <= $config['end']);
    }

    /**
     * Obtenir la prochaine heure valide d'envoi
     */
    private function getNextValidSendTime(): Carbon
    {
        $now = Carbon::now('Europe/Paris');

        // Si weekend, aller au lundi suivant
        if ($now->isWeekend()) {
            return $now->next(Carbon::MONDAY)->setTime(10, 0);
        }

        // Si après 20h, jour suivant à 10h
        if ($now->format('H:i') > '20:00') {
            return $now->addDay()->setTime(10, 0);
        }

        // Si pause déjeuner, reprendre à 14h
        if ($now->format('H:i') >= '13:00' && $now->format('H:i') < '14:00') {
            return $now->setTime(14, 0);
        }

        // Si avant 10h, attendre 10h
        if ($now->format('H:i') < '10:00') {
            return $now->setTime(10, 0);
        }

        return $now;
    }

    /**
     * Obtenir les numéros de l'utilisateur
     */
    private function getUserPhoneNumbers(User $user): array
    {
        return DB::table('user_phone_numbers')
            ->where('user_id', $user->id)
            ->get()
            ->map(function($number) {
                return [
                    'phone_number' => $number->phone_number,
                    'sid' => $number->twilio_sid,
                    'monthly_cost' => $number->monthly_cost,
                    'purchased_at' => $number->purchased_at
                ];
            })
            ->toArray();
    }

    /**
     * Mettre à jour les statistiques de campagne
     */
    private function updateCampaignStats(Campaign $campaign): void
    {
        $delivered = $campaign->messages()->where('status', 'delivered')->count();
        $failed = $campaign->messages()->where('status', 'failed')->count();

        $campaign->update([
            'delivered_count' => $delivered,
            'failed_count' => $failed
        ]);
    }

    /**
     * Logger les communications
     */
    private function logCommunication($from, $to, $content, $response, $channel, $direction, $external_id = null, $campaign_id = null): void
    {
        try {
            DB::table('communications')->insert([
                'from' => $from,
                'to' => $to,
                'content' => $content,
                'response' => $response,
                'channel' => $channel,
                'direction' => $direction,
                'external_id' => $external_id,
                'campaign_id' => $campaign_id,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } catch (Exception $e) {
            Log::error('Erreur log communication', ['error' => $e->getMessage()]);
        }
    }

    /**
     * ================================
     * API PUBLIQUES POUR LE FRONTEND
     * ================================
     */

    /**
     * Obtenir le dashboard des statistiques
     */
    public function getDashboard()
    {
        try {
            $user = auth()->user();

            return response()->json([
                'quota_info' => $this->getUserQuotaInfo($user),
                'recent_campaigns' => Campaign::where('user_id', $user->id)
                    ->latest()
                    ->take(5)
                    ->with('recipients')
                    ->get(),
                'monthly_stats' => $this->getMonthlyStats($user),
                'phone_numbers' => $this->getUserPhoneNumbers($user)
            ]);

        } catch (Exception $e) {
            return response()->json(['error' => 'Erreur chargement dashboard'], 500);
        }
    }

    /**
     * Obtenir les statistiques mensuelles
     */
    private function getMonthlyStats(User $user): array
    {
        $startOfMonth = now()->startOfMonth();

        return [
            'total_sent' => Message::where('user_id', $user->id)
                ->where('created_at', '>=', $startOfMonth)
                ->count(),
            'delivered' => Message::where('user_id', $user->id)
                ->where('status', 'delivered')
                ->where('created_at', '>=', $startOfMonth)
                ->count(),
            'failed' => Message::where('user_id', $user->id)
                ->where('status', 'failed')
                ->where('created_at', '>=', $startOfMonth)
                ->count(),
            'campaigns_count' => Campaign::where('user_id', $user->id)
                ->where('created_at', '>=', $startOfMonth)
                ->count()
        ];
    }

    /**
     * Envoyer un SMS rapide
     */
    public function sendQuickSms(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'message' => 'required|string|max:160'
        ]);

        try {
            $user = auth()->user();
            $client = ClientModel::findOrFail($request->client_id);

            // Vérifier quota
            if (!$this->checkUserQuota($user, 1)) {
                return response()->json(['error' => 'Quota SMS insuffisant'], 429);
            }

            // Vérifier que le client peut recevoir des SMS
            if ($client->opt_out) {
                return response()->json(['error' => 'Ce client s\'est désinscrit des SMS'], 400);
            }

            // Lancer l'envoi via Job queue
            SendSmsJob::dispatch($user, $client, $request->message);

            return response()->json([
                'success' => true,
                'message' => 'SMS mis en file d\'attente pour envoi',
                'status' => 'queued'
            ]);

        } catch (Exception $e) {
            Log::error('Erreur envoi SMS rapide', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Erreur lors de l\'envoi'], 500);
        }
    }
}
