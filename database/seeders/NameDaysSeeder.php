<?php

namespace Database\Seeders;

use App\Models\CalendarEvent;
use Illuminate\Database\Seeder;

class NameDaysSeeder extends Seeder
{
    /**
     * Seed les fêtes des prénoms pour toute l'année
     * Cette classe peut être appelée séparément ou depuis CalendarEventsSeeder
     */
    public function run(): void
    {
        // Tableau complet des fêtes des prénoms
        $nameDays = $this->getNameDays();

        foreach ($nameDays as $nameDay) {
            $code = 'name_day_' . strtolower($nameDay['name']);
            $name = 'Fête des ' . $nameDay['name'];

            $templateFr = $nameDay['template_fr'] ?? 'Bonne fête [Prénom] ! Pour célébrer, voici une offre spéciale rien que pour vous.';
            $templateEn = $nameDay['template_en'] ?? 'Happy name day [FirstName]! To celebrate, here\'s a special offer just for you.';

            CalendarEvent::firstOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'description' => 'Souhaiter une bonne fête aux clients portant ce prénom',
                    'category' => 'personal',
                    'is_global' => false,
                    'month' => $nameDay['month'],
                    'day' => $nameDay['day'],
                    'is_active' => true,
                    'metadata' => [
                        'type' => 'name_day',
                        'name' => $nameDay['name'],
                        'template_fr' => $templateFr,
                        'template_en' => $templateEn
                    ]
                ]
            );
        }
    }

    /**
     * Retourne un tableau des fêtes des prénoms
     * Dans une implémentation réelle, vous pourriez charger ces données depuis un fichier CSV
     */
    private function getNameDays(): array
    {
        // Exemple de données pour janvier - Vous devriez étendre cela pour tous les mois
        return [
            // JANVIER
            ['name' => 'Marie', 'month' => '01', 'day' => '01'],
            ['name' => 'Basile', 'month' => '01', 'day' => '02'],
            ['name' => 'Geneviève', 'month' => '01', 'day' => '03'],
            ['name' => 'Odilon', 'month' => '01', 'day' => '04'],
            ['name' => 'Édouard', 'month' => '01', 'day' => '05'],
            ['name' => 'Mélaine', 'month' => '01', 'day' => '06'],
            ['name' => 'Raymond', 'month' => '01', 'day' => '07'],
            ['name' => 'Lucien', 'month' => '01', 'day' => '08'],
            ['name' => 'Alix', 'month' => '01', 'day' => '09'],
            ['name' => 'Guillaume', 'month' => '01', 'day' => '10'],
            ['name' => 'Paulin', 'month' => '01', 'day' => '11'],
            ['name' => 'Tatiana', 'month' => '01', 'day' => '12'],
            ['name' => 'Yvette', 'month' => '01', 'day' => '13'],
            ['name' => 'Nina', 'month' => '01', 'day' => '14'],
            ['name' => 'Rémi', 'month' => '01', 'day' => '15'],
            // ... ajoutez tous les autres prénoms pour janvier

            // FÉVRIER
            ['name' => 'Ella', 'month' => '02', 'day' => '01'],
            ['name' => 'Agathe', 'month' => '02', 'day' => '02'],
            ['name' => 'Blaise', 'month' => '02', 'day' => '03'],
            // ... ajoutez tous les prénoms pour février

            // Ajoutez les mois suivants de la même manière
        ];
    }
}
