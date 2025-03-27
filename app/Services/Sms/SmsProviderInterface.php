<?php

namespace App\Services\Sms;

use App\Services\SmsResult;

interface SmsProviderInterface
{
    /**
     * Envoyer un message SMS à un numéro
     *
     * @param string $phone Numéro de téléphone du destinataire
     * @param string $message Contenu du message
     * @return SmsResult Résultat de l'envoi avec statut et identifiant du message
     */
    public function send(string $phone, string $message): SmsResult;

    /**
     * Envoyer plusieurs messages en lot
     *
     * @param array $messages Tableau de messages au format [['to' => '...', 'content' => '...']]
     * @return array Résultats de l'envoi en lot
     */
    public function sendBatch(array $messages): array;

    /**
     * Obtenir le statut de livraison d'un message
     *
     * @param string $messageId Identifiant du message
     * @return string Statut de livraison (delivered, failed, pending, etc.)
     */
    public function getDeliveryStatus(string $messageId): string;
} 