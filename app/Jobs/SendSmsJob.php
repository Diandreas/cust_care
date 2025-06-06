<?php

namespace App\Jobs;

use App\Models\Message;
use App\Models\Client;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Twilio\Rest\Client as TwilioClient;
use Twilio\Exceptions\TwilioException;

class SendSmsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [10, 30, 60]; // Backoff en secondes
    public $timeout = 60;

    protected User $user;
    protected Client $client;
    protected string $message;
    protected ?int $campaignId;

    /**
     * Create a new job instance.
     */
    public function __construct(User $user, Client $client, string $message, ?int $campaignId = null)
    {
        $this->user = $user;
        $this->client = $client;
        $this->message = $message;
        $this->campaignId = $campaignId;
        $this->onQueue('sms');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Vérifier que le client peut recevoir des SMS
            if ($this->client->opt_out) {
                Log::warning("Tentative d'envoi à un client désinscrit", [
                    'user_id' => $this->user->id,
                    'client_id' => $this->client->id
                ]);
                return;
            }

            // Initialiser Twilio
            $twilio = new TwilioClient(
                config('services.twilio.sid'),
                config('services.twilio.auth_token')
            );

            // Obtenir le numéro d'envoi
            $fromNumber = $this->getFromNumberForUser($this->user);

            // Personnaliser le message
            $personalizedMessage = $this->personalizeMessage($this->message, $this->client);

            // Envoyer le SMS (sans webhook)
            $twilioMessage = $twilio->messages->create($this->client->phone, [
                'from' => $fromNumber,
                'body' => $personalizedMessage
            ]);

            // Enregistrer le message en base
            $message = Message::create([
                'user_id' => $this->user->id,
                'client_id' => $this->client->id,
                'campaign_id' => $this->campaignId,
                'content' => $personalizedMessage,
                'status' => 'sent',
                'type' => $this->campaignId ? 'promotional' : 'personal',
                'sent_at' => now(),
                'external_id' => $twilioMessage->sid
            ]);

            // Logger la communication
            $this->logCommunication(
                $fromNumber,
                $this->client->phone,
                $personalizedMessage,
                '',
                'sms',
                'outbound',
                $twilioMessage->sid,
                $this->campaignId
            );

            Log::info("SMS envoyé avec succès", [
                'user_id' => $this->user->id,
                'client_id' => $this->client->id,
                'message_id' => $message->id,
                'twilio_sid' => $twilioMessage->sid
            ]);

        } catch (TwilioException $e) {
            $this->handleTwilioError($e);
        } catch (\Exception $e) {
            $this->handleGeneralError($e);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Job SMS échoué définitivement", [
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts()
        ]);

        // Enregistrer le message comme échoué
        Message::create([
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'campaign_id' => $this->campaignId,
            'content' => $this->personalizeMessage($this->message, $this->client),
            'status' => 'failed',
            'type' => $this->campaignId ? 'promotional' : 'personal',
            'sent_at' => now(),
            'error_code' => $exception->getCode()
        ]);
    }

    /**
     * Gérer les erreurs Twilio spécifiques
     */
    private function handleTwilioError(TwilioException $e): void
    {
        $errorCode = $e->getCode();

        // Erreurs non-retriables (numéro invalide, opt-out, etc.)
        $nonRetriableErrors = [21610, 21614, 21211, 21408, 21612];

        if (in_array($errorCode, $nonRetriableErrors)) {
            Log::warning("Erreur Twilio non-retriable", [
                'user_id' => $this->user->id,
                'client_id' => $this->client->id,
                'error_code' => $errorCode,
                'error' => $e->getMessage()
            ]);

            // Marquer le client comme opt-out si c'est une erreur de désabonnement
            if (in_array($errorCode, [21610, 21614])) {
                $this->client->update(['opt_out' => true, 'opt_out_date' => now()]);
            }

            $this->fail($e);
            return;
        }

        // Autres erreurs Twilio - retry
        Log::warning("Erreur Twilio retriable", [
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'error_code' => $errorCode,
            'error' => $e->getMessage(),
            'attempt' => $this->attempts()
        ]);

        throw $e; // Déclenche le retry
    }

    /**
     * Gérer les erreurs générales
     */
    private function handleGeneralError(\Exception $e): void
    {
        Log::error("Erreur générale envoi SMS", [
            'user_id' => $this->user->id,
            'client_id' => $this->client->id,
            'error' => $e->getMessage(),
            'attempt' => $this->attempts()
        ]);

        throw $e; // Déclenche le retry
    }

    /**
     * Personnaliser le message
     */
    private function personalizeMessage(string $template, Client $client): string
    {
        $variables = [
            '{nom}' => $client->name ?? '',
            '{prenom}' => $client->first_name ?? '',
            '{entreprise}' => $client->company ?? '',
            '{email}' => $client->email ?? '',
            '{date}' => now()->format('d/m/Y'),
            '{heure}' => now()->format('H:i')
        ];

        return str_replace(array_keys($variables), array_values($variables), $template);
    }

    /**
     * Obtenir le numéro d'envoi selon l'abonnement utilisateur
     */
    private function getFromNumberForUser(User $user): string
    {
        $subscription = $user->subscription;

        if (!$subscription || $subscription->plan === 'starter') {
            return config('services.twilio.from_number');
        }

        // Chercher un numéro dédié
        $userNumber = DB::table('user_phone_numbers')
            ->where('user_id', $user->id)
            ->first();

        return $userNumber ? $userNumber->phone_number : config('services.twilio.from_number');
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
