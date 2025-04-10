<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Visit>
 */
class VisitFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $visitDate = fake()->dateTimeBetween('-6 months', 'now');
        
        return [
            'user_id' => User::factory(),
            'client_id' => Client::factory(),
            'visit_date' => $visitDate,
            'notes' => fake()->optional(0.7)->realText(100),
            'created_at' => $visitDate,
            'updated_at' => function (array $attributes) {
                return fake()->dateTimeBetween($attributes['created_at'], 'now');
            },
        ];
    }
} 