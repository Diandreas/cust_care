<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\UsageTrackingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class SubscriptionTest extends TestCase
{
    use RefreshDatabase;
    
    /**
     * Tester la création d'un abonnement
     */
    public function test_create_subscription()
    {
        // Créer un utilisateur
        $user = User::factory()->create();
        
        // Créer un plan d'abonnement
        $plan = SubscriptionPlan::create([
            'name' => 'Pack Test',
            'code' => 'test',
            'price' => 5000,
            'max_clients' => 100,
            'max_campaigns_per_month' => 2,
            'total_campaign_sms' => 200, 
            'monthly_sms_quota' => 50,
            'unused_sms_rollover_percent' => 0,
            'is_active' => true,
            'description' => 'Plan de test',
            'features' => [
                'Jusqu\'à 100 clients dans la base de données',
                '2 campagnes par mois (200 SMS au total)',
                '50 SMS de réserve mensuelle',
                'Les SMS non utilisés expirent à la fin du mois'
            ]
        ]);
        
        // Créer un abonnement
        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'plan' => $plan->name,
            'status' => 'active',
            'starts_at' => now(),
            'expires_at' => now()->addMonth(),
            'clients_limit' => $plan->max_clients,
            'campaigns_limit' => $plan->max_campaigns_per_month,
            'campaign_sms_limit' => $plan->total_campaign_sms,
            'personal_sms_quota' => $plan->monthly_sms_quota,
            'sms_used' => 0,
            'campaigns_used' => 0,
            'next_renewal_date' => now()->addMonth(),
        ]);
        
        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'plan' => $plan->name,
        ]);
        
        // Tester le suivi d'utilisation
        $tracker = new UsageTrackingService();
        
        // L'utilisateur devrait pouvoir envoyer des SMS
        $this->assertTrue($tracker->canSendSms($user, 10));
        
        // L'utilisateur devrait pouvoir créer une campagne
        $this->assertTrue($tracker->canCreateCampaign($user));
        
        // Suivre l'utilisation de SMS
        $this->assertTrue($tracker->trackSmsUsage($user, 10));
        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user->id,
            'sms_used' => 10,
        ]);
        
        // Suivre l'utilisation de campagnes
        $this->assertTrue($tracker->trackCampaignUsage($user));
        $this->assertDatabaseHas('subscriptions', [
            'user_id' => $user->id,
            'campaigns_used' => 1,
        ]);
        
        // On ne devrait plus pouvoir créer de campagne si on atteint la limite
        $this->assertTrue($tracker->trackCampaignUsage($user)); // 2ème campagne
        $this->assertFalse($tracker->trackCampaignUsage($user)); // 3ème campagne (dépasse la limite)
        
        // On ne devrait plus pouvoir envoyer de SMS si on atteint la limite
        $this->assertTrue($tracker->trackSmsUsage($user, 40)); // 50 au total (atteint la limite)
        $this->assertFalse($tracker->trackSmsUsage($user, 1)); // 1 de plus (dépasse la limite)
    }
} 