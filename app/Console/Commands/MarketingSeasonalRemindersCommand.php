<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MarketingAutomationService;
use App\Models\MarketingAutomationRule;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class MarketingSeasonalRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'marketing:seasonal-reminders 
                            {--user= : ID de l\'utilisateur spécifique}
                            {--create-defaults : Créer les règles saisonnières par défaut}
                            {--dry-run : Mode test sans exécution réelle}
                            {--verbose : Affichage détaillé}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gérer les rappels saisonniers automatiques (Noël, Nouvel An, etc.)';

    /**
     * Execute the console command.
     */
    public function handle(MarketingAutomationService $automationService): int
    {
        $userId = $this->option('user');
        $createDefaults = $this->option('create-defaults');
        $dryRun = $this->option('dry-run');
        $verbose = $this->option('verbose');

        $this->info('🎊 Gestion des rappels saisonniers marketing...');
        
        if ($dryRun) {
            $this->warn('⚠️  Mode test activé - Aucune action ne sera effectuée');
        }

        try {
            if ($createDefaults) {
                $this->createDefaultSeasonalRules($userId);
            }

            $this->executeSeasonalReminders($automationService, $userId, $dryRun, $verbose);

            $this->info('✅ Rappels saisonniers traités avec succès');
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors du traitement des rappels saisonniers : {$e->getMessage()}");
            
            if ($verbose) {
                $this->error("Stack trace : {$e->getTraceAsString()}");
            }

            Log::error('Marketing seasonal reminders command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $userId,
            ]);

            return Command::FAILURE;
        }
    }

    /**
     * Créer les règles saisonnières par défaut
     */
    protected function createDefaultSeasonalRules(?string $userId): void
    {
        $this->info('🔧 Création des règles saisonnières par défaut...');

        $users = $userId ? User::where('id', $userId)->get() : User::all();

        foreach ($users as $user) {
            $this->info("👤 Création des règles pour l'utilisateur : {$user->name} (ID: {$user->id})");

            // Vérifier si les règles existent déjà
            $existingRules = MarketingAutomationRule::where('user_id', $user->id)
                ->ofType('seasonal')
                ->get()
                ->pluck('name')
                ->toArray();

            $defaultRules = $this->getDefaultSeasonalRules();

            foreach ($defaultRules as $ruleName => $ruleData) {
                if (!in_array($ruleName, $existingRules)) {
                    $this->line("   📝 Création de la règle : {$ruleName}");
                    
                    try {
                        $automationService = app(MarketingAutomationService::class);
                        $automationService->createSeasonalRule(
                            $user->id,
                            $ruleName,
                            $ruleData['dates'],
                            [
                                'message' => $ruleData['message'],
                                'use_ai' => true,
                            ]
                        );
                        
                        $this->line("   ✅ Règle créée avec succès");
                    } catch (\Exception $e) {
                        $this->warn("   ⚠️  Erreur lors de la création : {$e->getMessage()}");
                    }
                } else {
                    $this->line("   ℹ️  Règle déjà existante : {$ruleName}");
                }
            }
        }

        $this->info('✅ Règles saisonnières par défaut créées');
    }

    /**
     * Exécuter les rappels saisonniers
     */
    protected function executeSeasonalReminders(
        MarketingAutomationService $automationService, 
        ?string $userId, 
        bool $dryRun, 
        bool $verbose
    ): void {
        $this->info('🚀 Exécution des rappels saisonniers...');

        if ($dryRun) {
            $this->info('📋 Mode test - Affichage des règles qui seraient exécutées');
            $this->showSeasonalRules($userId, $verbose);
            return;
        }

        $results = $automationService->executeSeasonalAutomations();
        
        $this->displaySeasonalResults($results, $verbose);
    }

    /**
     * Afficher les règles saisonnières (mode test)
     */
    protected function showSeasonalRules(?string $userId, bool $verbose): void
    {
        $query = MarketingAutomationRule::ofType('seasonal');
        
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $rules = $query->active()->get();

        if ($rules->isEmpty()) {
            $this->warn('⚠️  Aucune règle saisonnière active trouvée');
            return;
        }

        $this->info("📋 Règles saisonnières actives ({$rules->count()}) :");
        $this->newLine();

        foreach ($rules as $rule) {
            $user = $rule->user;
            $this->info("🔹 {$rule->name} (Utilisateur: {$user->name})");
            $this->line("   Description : {$rule->description}");
            $this->line("   Statut : {$rule->status}");
            $this->line("   Dernière exécution : " . ($rule->last_executed_at ? $rule->last_executed_at->diffForHumans() : 'Jamais'));
            $this->line("   Nombre d'exécutions : {$rule->execution_count}");
            
            if ($verbose && $rule->trigger_conditions) {
                $this->line("   Dates déclencheurs : " . implode(', ', $rule->trigger_conditions['dates'] ?? []));
            }
            
            $this->newLine();
        }
    }

    /**
     * Afficher les résultats des rappels saisonniers
     */
    protected function displaySeasonalResults(array $results, bool $verbose): void
    {
        $this->newLine();
        $this->info('📊 Résultats des rappels saisonniers :');
        $this->newLine();

        if (isset($results['seasonal_rules'])) {
            $this->info("🔹 Règles saisonnières :");
            $this->line("   Total : {$results['seasonal_rules']}");
            $this->line("   Exécutées : {$results['executed']}");
            
            if ($verbose && isset($results['errors']) && !empty($results['errors'])) {
                $this->warn("   Erreurs :");
                foreach ($results['errors'] as $error) {
                    if (is_array($error)) {
                        $errorMsg = $error['error'] ?? 'Erreur inconnue';
                        $this->line("     - {$errorMsg}");
                    } else {
                        $this->line("     - {$error}");
                    }
                }
            }
        }

        $this->newLine();
    }

    /**
     * Obtenir les règles saisonnières par défaut
     */
    protected function getDefaultSeasonalRules(): array
    {
        return [
            'Nouvel An' => [
                'dates' => ['01-01'],
                'message' => '🎊 Bonne année {nom} ! Que 2024 vous apporte bonheur, santé et succès ! 🎉',
            ],
            'Saint-Valentin' => [
                'dates' => ['02-14'],
                'message' => '💝 Bonne Saint-Valentin {nom} ! Passez une merveilleuse journée remplie d\'amour ! ❤️',
            ],
            'Fête des Mères' => [
                'dates' => ['05-12'], // Dernier dimanche de mai (approximatif)
                'message' => '👩 Bonne fête des Mères {nom} ! Vous méritez toute notre reconnaissance et notre amour ! 🌸',
            ],
            'Fête des Pères' => [
                'dates' => ['06-16'], // 3ème dimanche de juin (approximatif)
                'message' => '👨 Bonne fête des Pères {nom} ! Merci pour votre amour et votre soutien ! 🎯',
            ],
            'Rentrée' => [
                'dates' => ['09-01'],
                'message' => '🎒 Bonne rentrée {nom} ! Que cette nouvelle année scolaire soit pleine de réussites ! 📚',
            ],
            'Halloween' => [
                'dates' => ['10-31'],
                'message' => '🎃 Joyeux Halloween {nom} ! Passez une soirée effrayante et amusante ! 👻',
            ],
            'Noël' => [
                'dates' => ['12-25'],
                'message' => '🎄 Joyeux Noël {nom} ! Que cette fête soit remplie de joie, d\'amour et de bonheur ! ⭐',
            ],
            'Saint-Sylvestre' => [
                'dates' => ['12-31'],
                'message' => '🎆 Bonne Saint-Sylvestre {nom} ! Passez une excellente soirée et une merveilleuse année 2024 ! 🎊',
            ],
        ];
    }

    /**
     * Vérifier les dates saisonnières à venir
     */
    protected function checkUpcomingSeasonalDates(): array
    {
        $today = now();
        $upcomingDates = [];

        $seasonalDates = [
            '01-01' => 'Nouvel An',
            '02-14' => 'Saint-Valentin',
            '05-12' => 'Fête des Mères',
            '06-16' => 'Fête des Pères',
            '09-01' => 'Rentrée',
            '10-31' => 'Halloween',
            '12-25' => 'Noël',
            '12-31' => 'Saint-Sylvestre',
        ];

        foreach ($seasonalDates as $date => $name) {
            $dateParts = explode('-', $date);
            $month = (int) $dateParts[0];
            $day = (int) $dateParts[1];
            
            $thisYear = $today->year;
            $nextYear = $today->year + 1;
            
            // Vérifier cette année
            $thisYearDate = Carbon::createFromDate($thisYear, $month, $day);
            if ($thisYearDate->isFuture()) {
                $daysUntil = $today->diffInDays($thisYearDate);
                $upcomingDates[] = [
                    'name' => $name,
                    'date' => $thisYearDate->format('Y-m-d'),
                    'days_until' => $daysUntil,
                ];
            } else {
                // Vérifier l'année prochaine
                $nextYearDate = Carbon::createFromDate($nextYear, $month, $day);
                $daysUntil = $today->diffInDays($nextYearDate);
                $upcomingDates[] = [
                    'name' => $name,
                    'date' => $nextYearDate->format('Y-m-d'),
                    'days_until' => $daysUntil,
                ];
            }
        }

        // Trier par nombre de jours
        usort($upcomingDates, fn($a, $b) => $a['days_until'] <=> $b['days_until']);

        return $upcomingDates;
    }
}