<?php

namespace App\Jobs;

use App\Models\Campaign;
use App\Models\Message;
use App\Models\Client;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Twilio\Rest\Client as TwilioClient;
use Twilio\Exceptions\TwilioException;
use Carbon\Carbon;

class ProcessCampaignJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [30, 120, 300]; // Backoff progressif en secondes
    public $timeout = 300; // 5 minutes de timeout

    protected Campaign $campaign;

    /**
     * Create a new job instance.
     */
    public function __construct(Campaign $campaign)
    {
        $this->campaign = $campaign;
        $this->onQueue('sms');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Démarrage du traitement de la campagne", [
                'campaign_id' => $this->campaign->id,
                'campaign_name' => $this->campaign->name
            ]);

            // Vérifier que la campagne est toujours en état d'être traitée
            $this->campaign->refresh();

            if (!in_array($this->campaign->status, ['scheduled', 'sending'])) {
                Log::warning("Campagne non traitable", [
                    'campaign_id' => $this->campaign->id,
                    'status' => $this->campaign->status
                ]);
                return;
            }

            // Marquer la campagne comme en cours d'envoi
            $this->campaign->update(['status' => Campaign::STATUS_SENDING]);

            // Vérifier les heures autorisées (conformité France)
            if (!$this->isValidSendTime()) {
                $nextValidTime = $this->getNextValidSendTime();
                $this->campaign->update([
                    'scheduled_at' => $nextValidTime,
                    'status' => Campaign::STATUS_SCHEDULED
                ]);

                Log::info("Campagne reprogrammée pour heure autorisée", [
                    'campaign_id' => $this->campaign->id,
                    'next_send_time' => $nextValidTime
                ]);
                return;
            }

            // Initialiser Twilio
            $twilio = new TwilioClient(
                config('services.twilio.sid'),
                config('services.twilio.auth_token')
            );

            // Obtenir le numéro d'envoi
            $fromNumber = $this->getFromNumberForUser($this->campaign->user);

            // Récupérer les destinataires de la campagne
            $recipients = $this->campaign->recipients()->where('opt_out', false)->get();

            if ($recipients->isEmpty()) {
                Log::warning("Aucun destinataire valide pour la campagne", [
                    'campaign_id' => $this->campaign->id
                ]);

                $this->campaign->update(['status' => Campaign::STATUS_FAILED]);
                return;
            }

            $successCount = 0;
            $failureCount = 0;
            $totalRecipients = $recipients->count();

            Log::info("Début d'envoi de la campagne", [
                'campaign_id' => $this->campaign->id,
                'total_recipients' => $totalRecipients
            ]);

            // Traiter chaque destinataire
            foreach ($recipients as $index => $client) {
                try {
                    // Pause entre les envois pour respecter les limites Twilio
                    if ($index > 0 && $index % 10 === 0) {
                        sleep(1); // 1 seconde de pause tous les 10 messages
                    }

                    // Personnaliser le message
                    $personalizedMessage = $this->personalizeMessage(
                        $this->campaign->message_content,
                        $client
                    );

                    // Envoyer le SMS via Twilio (sans webhook)
                    $twilioMessage = $twilio->messages->create($client->phone, [
                        'from' => $fromNumber,
                        'body' => $personalizedMessage
                    ]);

                    // Enregistrer le message en base
                    Message::create([
                        'user_id' => $this->campaign->user_id,
                        'client_id' => $client->id,
                        'campaign_id' => $this->campaign->id,
                        'content' => $personalizedMessage,
                        'status' => 'sent',
                        'type' => 'promotional',
                        'sent_at' => now(),
                        'external_id' => $twilioMessage->sid
                    ]);

                    // Logger la communication
                    $this->logCommunication(
                        $fromNumber,
                        $client->phone,
                        $personalizedMessage,
                        '',
                        'sms',
                        'outbound',
                        $twilioMessage->sid,
                        $this->campaign->id
                    );

                    $successCount++;

                    Log::debug("SMS envoyé avec succès", [
                        'campaign_id' => $this->campaign->id,
                        'client_id' => $client->id,
                        'twilio_sid' => $twilioMessage->sid
                    ]);

                } catch (TwilioException $e) {
                    $failureCount++;

                    Log::error("Erreur envoi SMS Twilio", [
                        'campaign_id' => $this->campaign->id,
                        'client_id' => $client->id,
                        'error' => $e->getMessage(),
                        'code' => $e->getCode()
                    ]);

                    // Enregistrer le message comme échoué
                    Message::create([
                        'user_id' => $this->campaign->user_id,
                        'client_id' => $client->id,
                        'campaign_id' => $this->campaign->id,
                        'content' => $this->personalizeMessage($this->campaign->message_content, $client),
                        'status' => 'failed',
                        'type' => 'promotional',
                        'sent_at' => now(),
                        'error_code' => $e->getCode()
                    ]);

                } catch (\Exception $e) {
                    $failureCount++;

                    Log::error("Erreur générale envoi SMS", [
                        'campaign_id' => $this->campaign->id,
                        'client_id' => $client->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Mettre à jour les statistiques de la campagne
            $status = $this->determineCampaignStatus($successCount, $failureCount, $totalRecipients);

            $this->campaign->update([
                'delivered_count' => $successCount,
                'failed_count' => $failureCount,
                'status' => $status
            ]);

            Log::info("Campagne terminée", [
                'campaign_id' => $this->campaign->id,
                'success_count' => $successCount,
                'failure_count' => $failureCount,
                'total_recipients' => $totalRecipients,
                'final_status' => $status
            ]);

        } catch (\Exception $e) {
            $this->campaign->update(['status' => Campaign::STATUS_FAILED]);

            Log::error("Erreur critique dans le traitement de la campagne", [
                'campaign_id' => $this->campaign->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw $e; // Relancer l'exception pour déclencher le retry
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Job de campagne échoué définitivement", [
            'campaign_id' => $this->campaign->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        $this->campaign->update(['status' => Campaign::STATUS_FAILED]);
    }

    /**
     * Personnaliser le message avec les données du client
     */
    private function personalizeMessage(string $template, Client $client): string
    {
        $variables = [
            '{nom}' => $client->name ?? '',
            '{prenom}' => $client->first_name ?? '',
            '{entreprise}' => $client->company ?? '',
            '{email}' => $client->email ?? '',
            '{ville}' => $client->city ?? '',
            '{date}' => now()->format('d/m/Y'),
            '{heure}' => now()->format('H:i'),
            '{mois}' => now()->translatedFormat('F'),
            '{annee}' => now()->format('Y')
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
     * Obtenir le numéro d'envoi selon l'abonnement utilisateur
     */
    private function getFromNumberForUser($user): string
    {
        $subscription = $user->subscription;

        if (!$subscription || $subscription->plan === 'starter') {
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
     * Déterminer le statut final de la campagne
     */
    private function determineCampaignStatus(int $successCount, int $failureCount, int $totalRecipients): string
    {
        if ($successCount === 0) {
            return Campaign::STATUS_FAILED;
        } elseif ($failureCount === 0) {
            return Campaign::STATUS_SENT;
        } else {
            return Campaign::STATUS_PARTIALLY_SENT;
        }
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
        } catch (\Exception $e) {
            Log::error('Erreur log communication', ['error' => $e->getMessage()]);
        }
    }
}
