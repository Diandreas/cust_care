<?php

namespace Database\Seeders;

use App\Models\Plan;
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
                'slug' => 'starter',
                'price' => 5000,
                'billing_period' => 'monthly',
                'max_clients' => 100,
                'monthly_messages' => 250, // 200 campaign + 50 personal
                'monthly_campaigns' => 2,
                'advanced_analytics' => false,
                'custom_templates' => false,
                'features' => json_encode([
                    'Jusqu\'à 100 clients dans la base de données',
                    '2 campagnes par mois',
                    '250 SMS mensuels inclus',
                    'Les SMS non utilisés expirent à la fin du mois',
                    'Option annuelle disponible avec 20% de réduction'
                ]),
                'is_active' => true,
                'is_featured' => false
            ],
            [
                'name' => 'Pack Business',
                'slug' => 'business',
                'price' => 15000,
                'billing_period' => 'monthly',
                'max_clients' => 500,
                'monthly_messages' => 1200, // 1000 campaign + 200 personal
                'monthly_campaigns' => 4,
                'advanced_analytics' => true,
                'custom_templates' => true,
                'features' => json_encode([
                    'Jusqu\'à 500 clients dans la base de données',
                    '4 campagnes par mois',
                    '1200 SMS mensuels inclus',
                    'Analytique avancée des performances',
                    'Modèles de messages personnalisés',
                    'Option annuelle disponible avec 20% de réduction'
                ]),
                'is_active' => true,
                'is_featured' => true
            ],
            [
                'name' => 'Pack Enterprise',
                'slug' => 'enterprise',
                'price' => 30000,
                'billing_period' => 'monthly',
                'max_clients' => 2000,
                'monthly_messages' => 4500, // 4000 campaign + 500 personal
                'monthly_campaigns' => 8,
                'advanced_analytics' => true,
                'custom_templates' => true,
                'features' => json_encode([
                    'Jusqu\'à 2000 clients dans la base de données',
                    '8 campagnes par mois',
                    '4500 SMS mensuels inclus',
                    'Analytique avancée des performances',
                    'Modèles de messages personnalisés',
                    'Support prioritaire',
                    'Option annuelle disponible avec 20% de réduction'
                ]),
                'is_active' => true,
                'is_featured' => false
            ]
        ];

        foreach ($plans as $plan) {
            Plan::create($plan);
        }
    }
}
