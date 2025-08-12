<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\MarketingAutomationService;
use Illuminate\Support\Facades\Log;

class MarketingAutomationCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'marketing:automation 
                            {--type=all : Type d\'automatisation à exécuter (all, birthday, seasonal, new-client, inactive-client)}
                            {--user= : ID de l\'utilisateur spécifique}
                            {--dry-run : Mode test sans exécution réelle}
                            {--verbose : Affichage détaillé}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Exécuter les automatisations marketing (anniversaires, saisonnières, nouveaux clients, etc.)';

    /**
     * Execute the console command.
     */
    public function handle(MarketingAutomationService $automationService): int
    {
        $type = $this->option('type');
        $userId = $this->option('user');
        $dryRun = $this->option('dry-run');
        $verbose = $this->option('verbose');

        $this->info('🚀 Démarrage des automatisations marketing...');
        
        if ($dryRun) {
            $this->warn('⚠️  Mode test activé - Aucune action ne sera effectuée');
        }

        if ($userId) {
            $this->info("👤 Utilisateur ciblé : {$userId}");
        }

        $startTime = microtime(true);
        $results = [];

        try {
            switch ($type) {
                case 'birthday':
                    $this->info('🎂 Exécution des automatisations d\'anniversaire...');
                    $results['birthday'] = $automationService->executeBirthdayAutomations();
                    break;

                case 'seasonal':
                    $this->info('🎊 Exécution des automatisations saisonnières...');
                    $results['seasonal'] = $automationService->executeSeasonalAutomations();
                    break;

                case 'new-client':
                    $this->info('👋 Exécution des automatisations pour nouveaux clients...');
                    $results['new-client'] = $automationService->executeNewClientAutomations();
                    break;

                case 'inactive-client':
                    $this->info('😴 Exécution des automatisations pour clients inactifs...');
                    $results['inactive-client'] = $automationService->executeInactiveClientAutomations();
                    break;

                case 'all':
                default:
                    $this->info('🔄 Exécution de toutes les automatisations...');
                    $results['all'] = $automationService->executeAllAutomations();
                    
                    // Exécuter les automatisations spécifiques
                    $this->info('🎂 Exécution des automatisations d\'anniversaire...');
                    $results['birthday'] = $automationService->executeBirthdayAutomations();
                    
                    $this->info('🎊 Exécution des automatisations saisonnières...');
                    $results['seasonal'] = $automationService->executeSeasonalAutomations();
                    
                    $this->info('👋 Exécution des automatisations pour nouveaux clients...');
                    $results['new-client'] = $automationService->executeNewClientAutomations();
                    
                    $this->info('😴 Exécution des automatisations pour clients inactifs...');
                    $results['inactive-client'] = $automationService->executeInactiveClientAutomations();
                    break;
            }

            $endTime = microtime(true);
            $executionTime = round($endTime - $startTime, 2);

            // Afficher les résultats
            $this->displayResults($results, $executionTime, $verbose);

            // Log des résultats
            $this->logResults($results, $executionTime, $type, $userId);

            $this->info("✅ Automatisations terminées en {$executionTime}s");
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("❌ Erreur lors de l'exécution des automatisations : {$e->getMessage()}");
            
            if ($verbose) {
                $this->error("Stack trace : {$e->getTraceAsString()}");
            }

            Log::error('Marketing automation command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'type' => $type,
                'user_id' => $userId,
            ]);

            return Command::FAILURE;
        }
    }

    /**
     * Afficher les résultats des automatisations
     */
    protected function displayResults(array $results, float $executionTime, bool $verbose): void
    {
        $this->newLine();
        $this->info('📊 Résultats des automatisations :');
        $this->newLine();

        foreach ($results as $type => $result) {
            $this->info("🔹 {$type} :");
            
            if (isset($result['total_rules'])) {
                $this->line("   Règles totales : {$result['total_rules']}");
                $this->line("   Exécutées : {$result['executed']}");
                $this->line("   Échouées : {$result['failed']}");
            }

            if (isset($result['clients_with_birthday'])) {
                $this->line("   Clients avec anniversaire : {$result['clients_with_birthday']}");
                $this->line("   Messages envoyés : {$result['messages_sent']}");
            }

            if (isset($result['seasonal_rules'])) {
                $this->line("   Règles saisonnières : {$result['seasonal_rules']}");
                $this->line("   Exécutées : {$result['executed']}");
            }

            if (isset($result['new_clients'])) {
                $this->line("   Nouveaux clients : {$result['new_clients']}");
                $this->line("   Automatisations déclenchées : {$result['automations_triggered']}");
            }

            if (isset($result['inactive_clients'])) {
                $this->line("   Clients inactifs : {$result['inactive_clients']}");
                $this->line("   Automatisations déclenchées : {$result['automations_triggered']}");
            }

            // Afficher les erreurs si verbose
            if ($verbose && isset($result['errors']) && !empty($result['errors'])) {
                $this->warn("   Erreurs :");
                foreach ($result['errors'] as $error) {
                    if (is_array($error)) {
                        $errorMsg = $error['error'] ?? 'Erreur inconnue';
                        $this->line("     - {$errorMsg}");
                    } else {
                        $this->line("     - {$error}");
                    }
                }
            }

            $this->newLine();
        }

        $this->info("⏱️  Temps d'exécution : {$executionTime}s");
    }

    /**
     * Logger les résultats des automatisations
     */
    protected function logResults(array $results, float $executionTime, string $type, ?string $userId): void
    {
        $logData = [
            'type' => $type,
            'user_id' => $userId,
            'execution_time' => $executionTime,
            'results' => $results,
            'timestamp' => now()->toISOString(),
        ];

        Log::info('Marketing automation command executed', $logData);

        // Log des erreurs si présentes
        foreach ($results as $resultType => $result) {
            if (isset($result['errors']) && !empty($result['errors'])) {
                Log::warning("Marketing automation errors for {$resultType}", [
                    'type' => $resultType,
                    'errors' => $result['errors'],
                    'user_id' => $userId,
                ]);
            }
        }
    }
}