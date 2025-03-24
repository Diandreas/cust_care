<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class UsageTrackingService
{
    /**
     * Suivre l'utilisation de SMS
     *
     * @param User $user L'utilisateur
     * @param int $smsCount Nombre de SMS envoyés
     * @return bool True si l'opération a réussi, false sinon
     */
    public function trackSmsUsage(User $user, int $smsCount): bool
    {
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            Log::warning('Tentative d\'envoi de SMS sans abonnement actif', [
                'user_id' => $user->id,
                'sms_count' => $smsCount
            ]);
            return false;
        }
        
        // Vérifier si l'utilisateur a assez de SMS
        $remainingSms = $subscription->personal_sms_quota - $subscription->sms_used;
        
        if ($remainingSms < $smsCount) {
            Log::warning('Quota SMS insuffisant pour l\'envoi', [
                'user_id' => $user->id,
                'remaining_sms' => $remainingSms,
                'requested_sms' => $smsCount
            ]);
            return false;
        }
        
        // Mettre à jour l'utilisation
        $subscription->sms_used += $smsCount;
        $subscription->save();
        
        // Vérifier si le quota est presque épuisé (80% ou plus)
        $this->checkLowSmsQuota($subscription);
        
        return true;
    }
    
    /**
     * Suivre l'utilisation de campagnes
     *
     * @param User $user L'utilisateur
     * @return bool True si l'opération a réussi, false sinon
     */
    public function trackCampaignUsage(User $user): bool
    {
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            Log::warning('Tentative de création de campagne sans abonnement actif', [
                'user_id' => $user->id
            ]);
            return false;
        }
        
        // Vérifier si l'utilisateur a atteint sa limite de campagnes
        if ($subscription->campaigns_used >= $subscription->campaigns_limit) {
            Log::warning('Limite de campagnes atteinte', [
                'user_id' => $user->id,
                'campaigns_used' => $subscription->campaigns_used,
                'campaigns_limit' => $subscription->campaigns_limit
            ]);
            return false;
        }
        
        // Mettre à jour l'utilisation
        $subscription->campaigns_used += 1;
        $subscription->save();
        
        return true;
    }
    
    /**
     * Vérifier si le quota SMS est faible et enregistrer cette information
     *
     * @param Subscription $subscription
     * @return void
     */
    private function checkLowSmsQuota(Subscription $subscription): void
    {
        $usagePercent = ($subscription->sms_used / $subscription->personal_sms_quota) * 100;
        
        if ($usagePercent >= 80 && $usagePercent < 100) {
            Log::info('Quota SMS faible détecté', [
                'user_id' => $subscription->user_id,
                'usage_percent' => $usagePercent
            ]);
        } else if ($usagePercent >= 100) {
            Log::warning('Quota SMS épuisé', [
                'user_id' => $subscription->user_id,
                'sms_used' => $subscription->sms_used,
                'sms_quota' => $subscription->personal_sms_quota
            ]);
        }
    }
    
    /**
     * Vérifier si l'utilisateur peut envoyer des SMS
     *
     * @param User $user L'utilisateur
     * @param int $smsCount Nombre de SMS à envoyer
     * @return bool True si l'utilisateur peut envoyer les SMS, false sinon
     */
    public function canSendSms(User $user, int $smsCount): bool
    {
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return false;
        }
        
        $remainingSms = $subscription->personal_sms_quota - $subscription->sms_used;
        return $remainingSms >= $smsCount;
    }
    
    /**
     * Vérifier si l'utilisateur peut créer une campagne
     *
     * @param User $user L'utilisateur
     * @return bool True si l'utilisateur peut créer une campagne, false sinon
     */
    public function canCreateCampaign(User $user): bool
    {
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return false;
        }
        
        return $subscription->campaigns_used < $subscription->campaigns_limit;
    }
} 