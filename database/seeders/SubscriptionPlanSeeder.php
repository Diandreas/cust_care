<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Pack Starter',
                'code' => 'starter',
                'price' => 5000,
                'annual_price' => 48000, // 4000/mois pour engagement annuel (20% de réduction)
                'has_annual_option' => true,
                'annual_discount_percent' => 20,
                'max_clients' => 100,
                'max_campaigns_per_month' => 2,
                'total_campaign_sms' => 200,
                'monthly_sms_quota' => 50,
                'unused_sms_rollover_percent' => 0.00,
                'description' => 'Pack de démarrage pour petites entreprises',
                'features' => [
                    'Jusqu\'à 100 clients dans la base de données',
                    '2 campagnes par mois (200 SMS au total)',
                    '50 SMS de réserve mensuelle',
                    'Les SMS non utilisés expirent à la fin du mois',
                    'Option annuelle disponible avec 20% de réduction'
                ],
                'is_active' => true
            ],
            [
                'name' => 'Pack Business',
                'code' => 'business',
                'price' => 15000,
                'annual_price' => 144000, // 12000/mois pour engagement annuel (20% de réduction)
                'has_annual_option' => true,
                'annual_discount_percent' => 20,
                'max_clients' => 500,
                'max_campaigns_per_month' => 4,
                'total_campaign_sms' => 1000,
                'monthly_sms_quota' => 200,
                'unused_sms_rollover_percent' => 0.10,
                'description' => 'Pack pour entreprises en croissance',
                'features' => [
                    'Jusqu\'à 500 clients dans la base de données',
                    '4 campagnes par mois (1000 SMS au total)',
                    '200 SMS de réserve mensuelle',
                    '10% des SMS non utilisés sont reportés au mois suivant',
                    'Option annuelle disponible avec 20% de réduction'
                ],
                'is_active' => true
            ],
            [
                'name' => 'Pack Enterprise',
                'code' => 'enterprise',
                'price' => 30000,
                'annual_price' => 288000, // 24000/mois pour engagement annuel (20% de réduction)
                'has_annual_option' => true,
                'annual_discount_percent' => 20,
                'max_clients' => 2000,
                'max_campaigns_per_month' => 8,
                'total_campaign_sms' => 4000,
                'monthly_sms_quota' => 500,
                'unused_sms_rollover_percent' => 0.20,
                'description' => 'Pack pour grandes entreprises',
                'features' => [
                    'Jusqu\'à 2000 clients dans la base de données',
                    '8 campagnes par mois (4000 SMS au total)',
                    '500 SMS de réserve mensuelle',
                    '20% des SMS non utilisés sont reportés au mois suivant',
                    'Option annuelle disponible avec 20% de réduction'
                ],
                'is_active' => true
            ]
        ];
        
        foreach ($plans as $plan) {
            SubscriptionPlan::create($plan);
        }
    }
}
