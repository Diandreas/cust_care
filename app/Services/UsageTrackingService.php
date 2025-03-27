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
     * 
     * @param User $user L'utilisateur dont on suit l'usage
     * @param int $smsCount Nombre de SMS à ajouter au compteur
     * @param string $type Type de SMS ('personal' ou 'campaign')
     * @return bool True si l'opération a réussi, false sinon
     */
    public function trackSmsUsage(User $user, int $smsCount, string $type = 'personal')
    {
        // Obtenir l'abonnement actif de l'utilisateur
        $subscription = $user->subscription;

        if (!$subscription || $subscription->status !== 'active') {
            Log::warning('Tentative de suivi SMS pour un utilisateur sans abonnement actif', [
                'user_id' => $user->id,
                'sms_count' => $smsCount,
                'type' => $type
            ]);
            return false;
        }

        // Mise à jour du compteur approprié selon le type
        if ($type === 'campaign') {
            // Vérifier et mettre à jour le quota de campagne
            $subscription->campaign_sms_used += $smsCount;
        } else {
            // Vérifier et mettre à jour le quota personnel
            $subscription->sms_used += $smsCount;
        }
        
        // Sauvegarder les modifications
        $subscription->save();

        // Vérifier si l'utilisateur approche de sa limite
        $this->checkQuotaWarnings($subscription, $type);

        return true;
    }

    /**
     * Vérifier si l'utilisateur doit être averti de son utilisation
     */
    private function checkQuotaWarnings(Subscription $subscription, string $type = 'personal')
    {
        // Déterminer le quota total et l'utilisation selon le type
        $totalQuota = $type === 'campaign' 
            ? $subscription->campaign_sms_limit 
            : $subscription->personal_sms_quota;
            
        $usedSms = $type === 'campaign' 
            ? $subscription->campaign_sms_used 
            : $subscription->sms_used;
            
        if ($totalQuota <= 0) return;

        $usedPercentage = ($usedSms / $totalQuota) * 100;

        // Définir les seuils d'avertissement (75%, 90%, 95%)
        $warnThresholds = [75, 90, 95];

        // Journaliser uniquement si un seuil est atteint
        foreach ($warnThresholds as $threshold) {
            if ($usedPercentage >= $threshold && $usedPercentage < ($threshold + 1)) {
                Log::info('Avertissement de quota SMS pour l\'utilisateur', [
                    'user_id' => $subscription->user_id,
                    'usage_percentage' => round($usedPercentage, 2),
                    'threshold' => $threshold,
                    'used' => $usedSms,
                    'total' => $totalQuota,
                    'type' => $type
                ]);

                // Ici, on pourrait déclencher une notification
                break;
            }
        }
    }

    /**
     * Vérifier si l'utilisateur peut envoyer un certain nombre de SMS
     */
    public function canSendSms(User $user, int $smsCount, string $type = 'personal'): bool
    {
        $subscription = $user->subscription;

        if (!$subscription || $subscription->status !== 'active') {
            return false;
        }

        if ($type === 'campaign') {
            $availableSms = $subscription->campaign_sms_limit - $subscription->campaign_sms_used;
        } else {
            $availableSms = $subscription->personal_sms_quota - $subscription->sms_used;
        }

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
            // Estimation : environ 1/365 des clients ont leur anniversaire un jour donné
            return max(1, ceil($clientCount / 365));
        }

        // Par défaut, estimer à 10% des clients
        return ceil($clientCount / 10);
    }

    /**
     * Suivre l'utilisation des campagnes pour un utilisateur
     * 
     * @param User $user L'utilisateur à vérifier
     * @return bool True si l'utilisateur peut encore créer des campagnes, false sinon
     */
    public function trackCampaignUsage(User $user): bool
    {
        $subscription = $user->subscription;

        if (!$subscription) {
            return false;
        }

        // Vérifier si l'utilisateur a atteint sa limite mensuelle de campagnes
        $campaignsThisMonth = $user->campaigns()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // Vérifier si l'utilisateur peut encore créer des campagnes
        if ($subscription->campaigns_limit > 0 && $campaignsThisMonth >= $subscription->campaigns_limit) {
            return false;
        }

        return true;
    }
}
