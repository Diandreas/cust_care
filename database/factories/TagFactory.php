<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tag>
 */
class TagFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tagCategories = [
            'VIP', 'Fidèle', 'Nouveau', 'Inactif', 'Récurrent',
            'Étudiant', 'Professionnel', 'Retraité',
            'Service particulier', 'Zone géographique', 'Préférence',
            'Haut potentiel', 'À relancer', 'Intéressé par promotion'
        ];

        return [
            'user_id' => User::factory(),
            'name' => function () use ($tagCategories) {
                // Parfois retourne un tag prédéfini, parfois en génère un aléatoire
                return fake()->boolean(70)
                    ? fake()->randomElement($tagCategories)
                    : ucfirst(fake()->word());
            },
            'created_at' => fake()->dateTimeBetween('-1 year', 'now'),
            'updated_at' => function (array $attributes) {
                return fake()->dateTimeBetween($attributes['created_at'], 'now');
            },
        ];
    }
} 