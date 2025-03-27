<?php

namespace App\Services\Sms;

use App\Services\SmsResult;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected $provider;
    protected $factory;
    
    /**
     * Constructor
     */
    public function __construct(SmsProviderFactory $factory)
    {
        $this->factory = $factory;
        $this->provider = $factory->create();
    }
    
    /**
     * Envoyer un message SMS
     *
     * @param string $phoneNumber Numéro de téléphone du destinataire
     * @param string $message Contenu du message
     * @return SmsResult Résultat de l'envoi
     */
    public function send(string $phoneNumber, string $message): SmsResult
    {
        try {
            return $this->provider->send($phoneNumber, $message);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi SMS', [
                'phone' => $phoneNumber,
                'error' => $e->getMessage()
            ]);
            
            return new SmsResult(false, null, $e->getMessage());
        }
    }
    
    /**
     * Envoyer plusieurs messages en lot
     *
     * @param array $messages Tableau de messages au format [['to' => '...', 'content' => '...']]
     * @return array Résultats de l'envoi en lot ['success' => [...], 'failed' => [...]]
     */
    public function sendBatch(array $messages): array
    {
        try {
            return $this->provider->sendBatch($messages);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi en lot de SMS', [
                'count' => count($messages),
                'error' => $e->getMessage()
            ]);
            
            // Retourner un résultat par défaut en cas d'erreur
            return [
                'success' => [],
                'failed' => array_map(function($index) use ($e, $messages) {
                    return [
                        'error' => $e->getMessage(),
                        'client_id' => $messages[$index]['client_id'] ?? null
                    ];
                }, array_keys($messages))
            ];
        }
    }
    
    /**
     * Vérifier le statut de livraison d'un message
     *
     * @param string $messageId Identifiant du message
     * @return string Statut de livraison
     */
    public function checkDeliveryStatus(string $messageId): string
    {
        try {
            return $this->provider->getDeliveryStatus($messageId);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification du statut de livraison', [
                'message_id' => $messageId,
                'error' => $e->getMessage()
            ]);
            
            return 'unknown';
        }
    }
    
    /**
     * Changer de fournisseur SMS dynamiquement
     *
     * @param string $provider Identifiant du fournisseur
     * @return bool Succès du changement
     */
    public function switchProvider(string $provider): bool
    {
        try {
            $this->provider = $this->factory->create($provider);
            return true;
        } catch (\Exception $e) {
            Log::error('Erreur lors du changement de fournisseur SMS', [
                'provider' => $provider,
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }
} 