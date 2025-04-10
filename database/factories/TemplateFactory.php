<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Template>
 */
class TemplateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $templateTypes = [
            'Promotion' => [
                "Profitez de notre offre spéciale! [Produit/Service] à [Prix] seulement. Valable jusqu'au [Date].",
                "C'est le moment de découvrir notre [Produit/Service] avec [Pourcentage]% de réduction! Offre limitée.",
                "Offre spéciale : [Description] à [Prix]. Réservez maintenant au [Téléphone]."
            ],
            'Rappel' => [
                "Rappel: Votre rendez-vous est prévu pour le [Date] à [Heure]. Contactez-nous au [Téléphone] pour toute question.",
                "N'oubliez pas votre rendez-vous demain à [Heure]. À bientôt!",
                "Petit rappel pour votre [Service] planifié le [Date]. Nous vous attendons!"
            ],
            'Événement' => [
                "Rejoignez-nous pour [Événement] le [Date] à [Lieu]. Réservez votre place dès maintenant!",
                "Nous sommes heureux de vous inviter à notre [Événement] le [Date]. Détails: [Description]",
                "Ne manquez pas [Événement] ce [Date] à [Heure]! [Description]"
            ],
            'Remerciement' => [
                "Merci pour votre visite! Nous espérons vous revoir bientôt chez [Entreprise].",
                "Nous tenons à vous remercier pour votre fidélité. Votre prochain [Service] bénéficiera de [Avantage].",
                "Merci d'avoir choisi [Entreprise]! En tant que client fidèle, profitez de [Avantage] lors de votre prochaine visite."
            ],
            'Information' => [
                "Information importante: [Description]. Pour plus de détails, contactez-nous au [Téléphone].",
                "Nous souhaitons vous informer que [Information]. N'hésitez pas à nous contacter pour plus de détails.",
                "Mise à jour concernant votre [Service]: [Information]. Questions? Appelez-nous au [Téléphone]."
            ]
        ];
        
        $type = fake()->randomElement(array_keys($templateTypes));
        $content = fake()->randomElement($templateTypes[$type]);
        
        return [
            'user_id' => User::factory(),
            'name' => $type . ' - ' . fake()->words(3, true),
            'content' => $content,
            'created_at' => fake()->dateTimeBetween('-1 year', 'now'),
            'updated_at' => function (array $attributes) {
                return fake()->dateTimeBetween($attributes['created_at'], 'now');
            },
        ];
    }
} 