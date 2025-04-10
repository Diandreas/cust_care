<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Campaign;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Campaign>
 */
class CampaignFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(Campaign::$statuses);
        $recipientsCount = fake()->numberBetween(5, 100);
        
        // Pour les campagnes envoyées ou partiellement envoyées, générer des statistiques
        $deliveredCount = 0;
        $failedCount = 0;
        
        if (in_array($status, ['sent', 'partially_sent'])) {
            $deliveredCount = ceil($recipientsCount * fake()->randomFloat(2, 0.5, 0.98));
            $failedCount = $recipientsCount - $deliveredCount;
        }

        // Créer des dates appropriées selon le statut
        $createdAt = fake()->dateTimeBetween('-6 months', 'now');
        $scheduledAt = null;

        if ($status === 'draft') {
            $scheduledAt = null;
        } elseif ($status === 'scheduled') {
            $scheduledAt = fake()->dateTimeBetween('+1 day', '+2 weeks');
        } elseif (in_array($status, ['sending', 'paused', 'cancelled'])) {
            $scheduledAt = fake()->dateTimeBetween($createdAt, '+1 day');
        } elseif (in_array($status, ['sent', 'partially_sent', 'failed'])) {
            $scheduledAt = fake()->dateTimeBetween($createdAt, 'now');
        }

        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement([
                'Promotion spéciale', 'Offre de la semaine', 'Nouveauté produit',
                'Événement à venir', 'Rappel rendez-vous', 'Joyeuses fêtes',
                'Liquidation totale', 'Votre avis nous intéresse', 'Information importante'
            ]) . ' ' . fake()->realText(20),
            'message_content' => fake()->realText(150),
            'scheduled_at' => $scheduledAt,
            'status' => $status,
            'recipients_count' => $recipientsCount,
            'delivered_count' => $deliveredCount,
            'failed_count' => $failedCount,
            'created_at' => $createdAt,
            'updated_at' => fake()->dateTimeBetween($createdAt, 'now'),
        ];
    }
    
    /**
     * Indicate that the campaign is in draft status.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => Campaign::STATUS_DRAFT,
            'scheduled_at' => null,
        ]);
    }
    
    /**
     * Indicate that the campaign is scheduled.
     */
    public function scheduled(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => Campaign::STATUS_SCHEDULED,
                'scheduled_at' => fake()->dateTimeBetween('+1 day', '+2 weeks'),
            ];
        });
    }
    
    /**
     * Indicate that the campaign is already sent.
     */
    public function sent(): static
    {
        return $this->state(function (array $attributes) {
            $recipientsCount = $attributes['recipients_count'] ?? fake()->numberBetween(5, 100);
            $deliveredCount = ceil($recipientsCount * fake()->randomFloat(2, 0.8, 0.98));
            
            return [
                'status' => Campaign::STATUS_SENT,
                'scheduled_at' => fake()->dateTimeBetween('-2 weeks', '-1 day'),
                'recipients_count' => $recipientsCount,
                'delivered_count' => $deliveredCount,
                'failed_count' => $recipientsCount - $deliveredCount,
            ];
        });
    }
} 