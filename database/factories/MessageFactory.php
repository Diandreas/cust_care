<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Client;
use App\Models\Campaign;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statusOptions = ['sent', 'delivered', 'failed'];
        $status = fake()->randomElement($statusOptions);
        $typeOptions = ['promotional', 'personal', 'automatic'];
        
        $createdAt = fake()->dateTimeBetween('-3 months', 'now');
        $sentAt = $createdAt;
        $deliveredAt = $status === 'delivered' ? fake()->dateTimeBetween($sentAt, '+10 minutes') : null;
        
        return [
            'user_id' => User::factory(),
            'client_id' => Client::factory(),
            'campaign_id' => fake()->optional(0.7)->randomElement([null, Campaign::factory()]),
            'content' => fake()->realText(120),
            'status' => $status,
            'type' => fake()->randomElement($typeOptions),
            'sent_at' => $sentAt,
            'delivered_at' => $deliveredAt,
            'created_at' => $createdAt,
            'updated_at' => fake()->dateTimeBetween($createdAt, 'now'),
        ];
    }
    
    /**
     * Indicate that the message was delivered successfully.
     */
    public function delivered(): static
    {
        return $this->state(function (array $attributes) {
            $sentAt = $attributes['sent_at'] ?? fake()->dateTimeBetween('-1 day', '-10 minutes');
            
            return [
                'status' => 'delivered',
                'sent_at' => $sentAt,
                'delivered_at' => fake()->dateTimeBetween($sentAt, '+10 minutes'),
            ];
        });
    }
    
    /**
     * Indicate that the message failed to deliver.
     */
    public function failed(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => 'failed',
                'sent_at' => fake()->dateTimeBetween('-1 day', 'now'),
                'delivered_at' => null,
            ];
        });
    }
    
    /**
     * Indicate that the message is from a campaign.
     */
    public function fromCampaign(): static
    {
        return $this->state(fn (array $attributes) => [
            'campaign_id' => Campaign::factory(),
            'type' => 'promotional',
        ]);
    }
} 