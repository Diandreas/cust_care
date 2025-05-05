<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure we don't create duplicate plans
        if (Plan::count() > 0) {
            $this->command->info('Plans already exist, skipping seeding...');
            return;
        }

        $plans = [
            [
                'name' => 'Pack Starter',
                'code' => 'starter',
                'slug' => 'starter',
                'price' => 5000, // In the smallest currency unit
                'annual_price' => 48000,
                'annual_discount_percent' => 20,
                'max_clients' => 100,
                'max_campaigns_per_month' => 2,
                'total_campaign_sms' => 200,
                'monthly_sms_quota' => 50,
                'monthly_messages' => 250,
                'monthly_campaigns' => 2,
                'unused_sms_rollover_percent' => 0,
                'description' => 'Idéal pour les petites entreprises et les indépendants',
                'features' => json_encode([
                    'Jusqu\'à 100 clients',
                    '2 campagnes par mois',
                    '200 SMS promotionnels',
                    '50 SMS personnalisés',
                    'Support par email',
                ]),
                'is_active' => true,
                'is_featured' => false,
            ],
            [
                'name' => 'Pack Business',
                'code' => 'business',
                'slug' => 'business',
                'price' => 15000,
                'annual_price' => 144000,
                'annual_discount_percent' => 20,
                'max_clients' => 500,
                'max_campaigns_per_month' => 4,
                'total_campaign_sms' => 1000,
                'monthly_sms_quota' => 200,
                'monthly_messages' => 1200,
                'monthly_campaigns' => 4,
                'unused_sms_rollover_percent' => 0.1,
                'description' => 'Parfait pour les PME avec une clientèle plus importante',
                'features' => json_encode([
                    'Jusqu\'à 500 clients',
                    '4 campagnes par mois',
                    '1000 SMS promotionnels',
                    '200 SMS personnalisés',
                    'Support téléphonique',
                    'Rapports détaillés',
                    'Report de 10% des SMS',
                ]),
                'is_active' => true,
                'is_featured' => true,
            ],
            [
                'name' => 'Pack Enterprise',
                'code' => 'enterprise',
                'slug' => 'enterprise',
                'price' => 30000,
                'annual_price' => 288000,
                'annual_discount_percent' => 20,
                'max_clients' => 2000,
                'max_campaigns_per_month' => 8,
                'total_campaign_sms' => 4000,
                'monthly_sms_quota' => 500,
                'monthly_messages' => 4500,
                'monthly_campaigns' => 8,
                'unused_sms_rollover_percent' => 0.2,
                'description' => 'Solution complète pour les entreprises à fort volume',
                'features' => json_encode([
                    'Jusqu\'à 2000 clients',
                    '8 campagnes par mois',
                    '4000 SMS promotionnels',
                    '500 SMS personnalisés',
                    'Support prioritaire 24/7',
                    'Rapports avancés',
                    'API complète',
                    'Report de 20% des SMS',
                ]),
                'is_active' => true,
                'is_featured' => false,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::create($plan);
        }

        $this->command->info('Plans seeded successfully!');
    }
}
