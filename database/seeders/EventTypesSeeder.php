<?php

namespace Database\Seeders;

use App\Models\EventType;
use Illuminate\Database\Seeder;

class EventTypesSeeder extends Seeder
{
    /**
     * Exécuter le seeder.
     */
    public function run(): void
    {
        $eventTypes = [
            // Événements personnels
            [
                'code' => 'birthday',
                'name' => 'Anniversaire',
                'description' => 'Événement déclenché le jour de l\'anniversaire d\'un client',
                'category' => 'personal',
                'default_template' => 'Cher(e) {{client.name}}, toute l\'équipe de {{user.name}} vous souhaite un joyeux anniversaire ! 🎂',
                'is_global' => true,
                'date_type' => 'client_field',
                'date_parameters' => json_encode(['field' => 'birthday']),
                'audience_logic' => 'all',
                'is_active' => true,
            ],
            [
                'code' => 'name_day',
                'name' => 'Fête du prénom',
                'description' => 'Événement déclenché le jour de la fête du prénom d\'un client',
                'category' => 'personal',
                'default_template' => 'Bonne fête {{client.name}} ! En ce jour spécial, toute l\'équipe de {{user.name}} vous souhaite une excellente journée. 🎉',
                'is_global' => true,
                'date_type' => 'client_field',
                'date_parameters' => json_encode(['field' => 'name_day']),
                'audience_logic' => 'all',
                'is_active' => true,
            ],
            
            // Événements calendaires
            [
                'code' => 'new_year',
                'name' => 'Nouvel An',
                'description' => 'Événement déclenché le 1er janvier',
                'category' => 'calendar',
                'default_template' => 'Cher(e) {{client.name}}, toute l\'équipe de {{user.name}} vous souhaite une excellente année {{year}} ! 🎊',
                'is_global' => true,
                'date_type' => 'fixed_date',
                'date_parameters' => json_encode(['month' => 1, 'day' => 1]),
                'audience_logic' => 'all',
                'is_active' => true,
            ],
            [
                'code' => 'womens_day',
                'name' => 'Journée Internationale de la Femme',
                'description' => 'Événement déclenché le 8 mars pour la Journée de la Femme',
                'category' => 'calendar',
                'default_template' => 'Chère {{client.name}}, à l\'occasion de la Journée Internationale de la Femme, toute l\'équipe de {{user.name}} vous souhaite une excellente journée ! 💐',
                'is_global' => true,
                'date_type' => 'fixed_date',
                'date_parameters' => json_encode(['month' => 3, 'day' => 8]),
                'audience_logic' => 'female',
                'is_active' => true,
            ],
            [
                'code' => 'mothers_day',
                'name' => 'Fête des Mères',
                'description' => 'Événement déclenché le dernier dimanche de mai',
                'category' => 'calendar',
                'default_template' => 'Chère {{client.name}}, toute l\'équipe de {{user.name}} vous souhaite une merveilleuse fête des Mères ! 🌸',
                'is_global' => true,
                'date_type' => 'fixed_date',
                'date_parameters' => json_encode(['month' => 5, 'day' => 25]), // Approximatif pour 2025
                'audience_logic' => 'female',
                'is_active' => true,
            ],
            [
                'code' => 'fathers_day',
                'name' => 'Fête des Pères',
                'description' => 'Événement déclenché le troisième dimanche de juin',
                'category' => 'calendar',
                'default_template' => 'Cher {{client.name}}, toute l\'équipe de {{user.name}} vous souhaite une excellente fête des Pères ! 👔',
                'is_global' => true,
                'date_type' => 'fixed_date',
                'date_parameters' => json_encode(['month' => 6, 'day' => 15]), // Approximatif pour 2025
                'audience_logic' => 'male',
                'is_active' => true,
            ],
            [
                'code' => 'christmas',
                'name' => 'Noël',
                'description' => 'Événement déclenché le 25 décembre',
                'category' => 'calendar',
                'default_template' => 'Cher(e) {{client.name}}, toute l\'équipe de {{user.name}} vous souhaite un joyeux Noël et d\'excellentes fêtes de fin d\'année ! 🎄',
                'is_global' => true,
                'date_type' => 'fixed_date',
                'date_parameters' => json_encode(['month' => 12, 'day' => 25]),
                'audience_logic' => 'all',
                'is_active' => true,
            ],
            
            // Événements marketing
            [
                'code' => 'valentine',
                'name' => 'Saint-Valentin',
                'description' => 'Événement déclenché le 14 février',
                'category' => 'marketing',
                'default_template' => 'Cher(e) {{client.name}}, à l\'occasion de la Saint-Valentin, découvrez nos offres spéciales chez {{user.business}} ! ❤️',
                'is_global' => true,
                'date_type' => 'fixed_date',
                'date_parameters' => json_encode(['month' => 2, 'day' => 14]),
                'audience_logic' => 'all',
                'is_active' => true,
            ],
            [
                'code' => 'black_friday',
                'name' => 'Black Friday',
                'description' => 'Événement déclenché le dernier vendredi de novembre',
                'category' => 'marketing',
                'default_template' => 'Cher(e) {{client.name}}, ne manquez pas nos promotions exceptionnelles pour le Black Friday chez {{user.business}} ! 🛍️',
                'is_global' => true,
                'date_type' => 'fixed_date',
                'date_parameters' => json_encode(['month' => 11, 'day' => 28]), // Approximatif pour 2025
                'audience_logic' => 'all',
                'is_active' => true,
            ],
            
            // Événements de rappel
            [
                'code' => 'christmas_reminder',
                'name' => 'Rappel avant Noël',
                'description' => 'Événement déclenché 7 jours avant Noël',
                'category' => 'marketing',
                'default_template' => 'Cher(e) {{client.name}}, Noël approche ! Découvrez nos idées cadeaux et offres spéciales chez {{user.business}}. 🎁',
                'is_global' => true,
                'date_type' => 'dynamic_date',
                'date_parameters' => json_encode(['base_event' => 'christmas', 'days_before' => 7]),
                'audience_logic' => 'all',
                'is_active' => true,
            ],
            [
                'code' => 'client_anniversary',
                'name' => 'Anniversaire de relation client',
                'description' => 'Événement déclenché à l\'anniversaire de la première visite du client',
                'category' => 'personal',
                'default_template' => 'Cher(e) {{client.name}}, cela fait exactement un an que vous nous faites confiance ! Toute l\'équipe de {{user.business}} vous remercie et vous offre une surprise lors de votre prochaine visite. 🎁',
                'is_global' => true,
                'date_type' => 'client_field',
                'date_parameters' => json_encode(['field' => 'created_at']),
                'audience_logic' => 'all',
                'is_active' => true,
            ],
        ];
        
        foreach ($eventTypes as $eventType) {
            EventType::updateOrCreate(
                ['code' => $eventType['code']],
                $eventType
            );
        }
    }
} 