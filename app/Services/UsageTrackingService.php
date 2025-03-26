<?php

namespace App\Services;

use App\Models\User;
use App\Models\Subscription;
use App\Models\EventType;
use Illuminate\Support\Facades\Log;

class UsageTrackingService
{
    /**
     * Suivre l'utilisation des SMS pour un utilisateur
     */
    public function trackSmsUsage(User $user, int $smsCount)
    {
        // Obtenir l'abonnement actif de l'utilisateur
        $subscription = $user->subscription;

        if (!$subscription) {
            Log::warning('Tentative de suivre l\'utilisation des SMS pour un utilisateur sans abonnement', [
                'user_id' => $user->id,
                'sms_count' => $smsCount
            ]);
            return false;
        }

        // Mettre à jour le compteur d'utilisation
        $subscription->sms_used += $smsCount;
        $subscription->save();

        // Vérifier si l'utilisateur approche de sa limite
        $this->checkQuotaWarnings($subscription);

        return true;
    }

    /**
     * Vérifier si l'utilisateur doit être averti de son utilisation
     */
    private function checkQuotaWarnings(Subscription $subscription)
    {
        // Calculer le pourcentage d'utilisation
        $totalQuota = $subscription->personal_sms_quota;
        if ($totalQuota <= 0) return;

        $usedPercentage = ($subscription->sms_used / $totalQuota) * 100;

        // Définir les seuils d'avertissement (75%, 90%, 95%)
        $warnThresholds = [75, 90, 95];

        // Journaliser uniquement si un seuil est atteint
        foreach ($warnThresholds as $threshold) {
            if ($usedPercentage >= $threshold && $usedPercentage < ($threshold + 1)) {
                Log::info('Avertissement de quota SMS pour l\'utilisateur', [
                    'user_id' => $subscription->user_id,
                    'usage_percentage' => round($usedPercentage, 2),
                    'threshold' => $threshold,
                    'used' => $subscription->sms_used,
                    'total' => $totalQuota
                ]);

                // Ici, on pourrait déclencher une notification
                break;
            }
        }
    }

    /**
     * Vérifier si l'utilisateur peut envoyer un certain nombre de SMS
     */
    public function canSendSms(User $user, int $smsCount): bool
    {
        $subscription = $user->subscription;

        if (!$subscription) {
            return false;
        }

        $availableSms = $subscription->personal_sms_quota - $subscription->sms_used;
        return $availableSms >= $smsCount;
    }

    /**
     * Vérifier si l'utilisateur peut activer un événement automatique
     */
    public function canActivateEvent(User $user, EventType $eventType): bool
    {
        // Vérifier si l'utilisateur a un abonnement actif
        if (!$user->subscription || !$user->subscription->is_active) {
            return false;
        }

        // Pour les événements qui ne consomment pas de SMS
        if ($eventType->category === 'notification') {
            return true;
        }

        // Pour les événements qui consomment des SMS, estimer l'utilisation
        $estimatedUsage = $this->estimateEventSmsUsage($user, $eventType);
        return $this->canSendSms($user, $estimatedUsage);
    }

    /**
     * Estimer l'utilisation de SMS pour un événement
     */
    private function estimateEventSmsUsage(User $user, EventType $eventType): int
    {
        // Cette méthode devrait être implémentée en fonction de la logique métier
        // spécifique à votre application

        // Version simplifiée pour l'exemple
        $clientCount = $user->clients()->count();

        if ($eventType->audience_logic === 'all') {
            return $clientCount;
        } elseif (in_array($eventType->audience_logic, ['male', 'female'])) {
            return ceil($clientCount / 2);
        } elseif ($eventType->code === 'birthday') {
            // Estimation : environ 1/365 des clients ont leur anniversaire un jour donné
            return max(1, ceil($clientCount / 365));
        }

        // Par défaut, estimer à 10% des clients
        return ceil($clientCount / 10);
    }
}
