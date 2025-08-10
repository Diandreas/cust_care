<?php

namespace App\Console\Commands;

use App\Services\AutomationService;
use App\Models\User;
use Illuminate\Console\Command;

class CreateSeasonalReminders extends Command
{
    protected $signature = 'marketing:seasonal-reminders {--user= : Specific user ID}';
    protected $description = 'Create seasonal reminders for marketing campaigns';

    public function handle(AutomationService $automationService): int
    {
        $users = $this->option('user') 
            ? User::where('id', $this->option('user'))->get()
            : User::all();

        $seasonalEvents = [
            ['name' => 'Nouvel An', 'date' => '01-01', 'message' => '🎉 Bonne année {nom} ! Nous vous souhaitons une année pleine de succès !'],
            ['name' => 'Saint-Valentin', 'date' => '02-14', 'message' => '💝 Joyeuse Saint-Valentin {nom} ! Profitez de nos offres spéciales pour l\'occasion !'],
            ['name' => 'Fête des Mères', 'date' => '05-28', 'message' => '👩 Bonne fête des mères {nom} ! Découvrez nos idées cadeaux exceptionnelles !'],
            ['name' => 'Fête des Pères', 'date' => '06-18', 'message' => '👨 Bonne fête des pères {nom} ! Trouvez le cadeau parfait chez nous !'],
            ['name' => 'Rentrée', 'date' => '09-01', 'message' => '🎒 Bonne rentrée {nom} ! Préparez-vous avec nos nouveautés de saison !'],
            ['name' => 'Halloween', 'date' => '10-31', 'message' => '🎃 Joyeux Halloween {nom} ! Découvrez nos promotions effrayantes !'],
            ['name' => 'Noël', 'date' => '12-25', 'message' => '🎄 Joyeux Noël {nom} ! Toute l\'équipe vous souhaite de merveilleuses fêtes !']
        ];

        $createdCount = 0;

        foreach ($users as $user) {
            foreach ($seasonalEvents as $event) {
                // Vérifier si une règle existe déjà pour cet événement et cet utilisateur
                $existingRule = \App\Models\AutomationRule::where('user_id', $user->id)
                    ->where('trigger_type', \App\Models\AutomationRule::TRIGGER_SEASONAL)
                    ->whereJsonContains('trigger_conditions->season', $event['name'])
                    ->first();

                if (!$existingRule) {
                    $automationService->createSeasonalReminder(
                        $event['name'],
                        $event['date'],
                        $event['message']
                    );
                    $createdCount++;
                }
            }
        }

        $this->info("Created $createdCount seasonal reminder rules.");
        return Command::SUCCESS;
    }
}