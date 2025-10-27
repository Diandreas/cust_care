<?php

namespace App\Console\Commands\Marketing;

use Illuminate\Console\Command;
use App\Models\AutomationRule;
use App\Models\Client;
use App\Models\User;
use App\Services\WhatsAppService;
use App\Services\AIContentService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ProcessMarketingAutomations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'marketing:automation {--rules : Exécuter seulement les règles d\'automatisation}
                                               {--seasonal : Exécuter seulement les rappels saisonniers}
                                               {--posts : Publier les posts programmés}
                                               {--all : Exécuter toutes les automatisations}
                                               {--user= : Exécuter pour un utilisateur spécifique}
                                               {--dry-run : Simulation sans exécuter les actions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Traiter les automatisations marketing : règles, rappels saisonniers, posts programmés';

    protected $whatsappService;
    protected $aiService;
    protected $processedCount = 0;
    protected $successCount = 0;
    protected $failureCount = 0;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->whatsappService = app(WhatsAppService::class);
        $this->aiService = app(AIContentService::class);

        $startTime = microtime(true);
        $this->info('🚀 Début du traitement des automatisations marketing - ' . now()->format('Y-m-d H:i:s'));

        try {
            // Déterminer les types d'automatisation à exécuter
            $executeRules = $this->option('rules') || $this->option('all');
            $executeSeasonal = $this->option('seasonal') || $this->option('all');
            $executePosts = $this->option('posts') || $this->option('all');
            
            // Si aucune option spécifique, exécuter les règles par défaut
            if (!$executeRules && !$executeSeasonal && !$executePosts) {
                $executeRules = true;
            }

            // Filtrer par utilisateur si spécifié
            $userId = $this->option('user');

            // Traitement des différents types d'automatisation
            if ($executeRules) {
                $this->processAutomationRules($userId);
            }

            if ($executeSeasonal) {
                $this->processSeasonalReminders($userId);
            }

            if ($executePosts) {
                $this->processScheduledPosts($userId);
            }

            // Nettoyage des anciennes données
            $this->cleanupOldData();

            $duration = round(microtime(true) - $startTime, 2);
            
            $this->newLine();
            $this->info("✅ Traitement terminé en {$duration}s");
            $this->info("📊 Résultats:");
            $this->info("   • Total traité: {$this->processedCount}");
            $this->info("   • Succès: {$this->successCount}");
            $this->info("   • Échecs: {$this->failureCount}");
            
            // Log du résultat
            Log::info('Marketing automatisations processed', [
                'processed' => $this->processedCount,
                'success' => $this->successCount,
                'failures' => $this->failureCount,
                'duration' => $duration,
                'user_id' => $userId
            ]);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors du traitement des automatisations: ' . $e->getMessage());
            Log::error('Marketing automations failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }

    /**
     * Traiter les règles d'automatisation
     */
    protected function processAutomationRules(?int $userId = null): void
    {
        $this->info('🔄 Traitement des règles d\'automatisation...');

        $query = AutomationRule::query()->dueForExecution();
        
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $rules = $query->orderBy('priority', 'desc')->get();

        if ($rules->isEmpty()) {
            $this->info('   ℹ️  Aucune règle à exécuter');
            return;
        }

        $this->info("   📋 {$rules->count()} règles à traiter");

        $bar = $this->output->createProgressBar($rules->count());
        $bar->start();

        foreach ($rules as $rule) {
            $this->processedCount++;
            
            if ($this->option('dry-run')) {
                $this->line("   [DRY-RUN] Règle: {$rule->name}");
                $bar->advance();
                continue;
            }

            try {
                $result = $rule->execute();
                
                if ($result['success']) {
                    $this->successCount++;
                } else {
                    $this->failureCount++;
                    Log::warning('Automation rule failed', [
                        'rule_id' => $rule->id,
                        'rule_name' => $rule->name,
                        'error' => $result['message']
                    ]);
                }

            } catch (\Exception $e) {
                $this->failureCount++;
                Log::error('Automation rule exception', [
                    'rule_id' => $rule->id,
                    'rule_name' => $rule->name,
                    'error' => $e->getMessage()
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
    }

    /**
     * Traiter les rappels saisonniers
     */
    protected function processSeasonalReminders(?int $userId = null): void
    {
        $this->info('🎉 Traitement des rappels saisonniers...');

        // Définir les événements saisonniers
        $seasonalEvents = $this->getSeasonalEvents();
        $today = now()->format('m-d');
        
        $todayEvents = collect($seasonalEvents)->filter(function ($event) use ($today) {
            return $event['date'] === $today;
        });

        if ($todayEvents->isEmpty()) {
            $this->info('   ℹ️  Aucun événement saisonnier aujourd\'hui');
            return;
        }

        $this->info("   🎊 {$todayEvents->count()} événements aujourd'hui");

        foreach ($todayEvents as $event) {
            $this->processSeasonalEvent($event, $userId);
        }
    }

    /**
     * Traiter un événement saisonnier
     */
    protected function processSeasonalEvent(array $event, ?int $userId = null): void
    {
        $query = User::query();
        
        if ($userId) {
            $query->where('id', $userId);
        }

        $users = $query->whereHas('clients')->get();

        foreach ($users as $user) {
            $this->processedCount++;

            if ($this->option('dry-run')) {
                $this->line("   [DRY-RUN] Événement '{$event['name']}' pour utilisateur {$user->name}");
                continue;
            }

            try {
                // Créer un message personnalisé avec l'IA
                $message = $this->generateSeasonalMessage($event, $user);
                
                // Envoyer aux clients actifs
                $activeClients = $user->clients()
                    ->where('opt_out', false)
                    ->where('last_visit', '>=', now()->subMonths(3))
                    ->get();

                if ($activeClients->isNotEmpty()) {
                    $clientIds = $activeClients->pluck('id')->toArray();
                    
                    $result = $this->whatsappService->sendBulkPersonalizedMessages(
                        $clientIds,
                        $message,
                        $user->id,
                        ['seasonal_event' => $event['name'], 'use_ai' => true]
                    );

                    if ($result['success']) {
                        $this->successCount++;
                        $this->info("   ✅ {$event['name']}: {$result['successful']} messages envoyés à {$user->name}");
                    } else {
                        $this->failureCount++;
                    }
                } else {
                    $this->info("   ⚠️  {$event['name']}: Aucun client actif pour {$user->name}");
                }

            } catch (\Exception $e) {
                $this->failureCount++;
                Log::error('Seasonal event processing failed', [
                    'event' => $event['name'],
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Traiter les posts programmés
     */
    protected function processScheduledPosts(?int $userId = null): void
    {
        $this->info('📅 Traitement des posts programmés...');
        
        // Pour l'instant, placeholder
        // Dans une future version, on pourrait ajouter la gestion des posts programmés
        $this->info('   ℹ️  Fonctionnalité des posts programmés en développement');
    }

    /**
     * Générer un message saisonnier avec l'IA
     */
    protected function generateSeasonalMessage(array $event, User $user): string
    {
        $template = $event['template'] ?? "Nous vous souhaitons un excellent {nom_evenement} ! Profitez de cette période spéciale avec vos proches. {entreprise}";
        
        // Personnaliser avec des infos de l'entreprise
        $businessInfo = $user->business_type ?? 'notre équipe';
        
        return str_replace([
            '{nom_evenement}',
            '{entreprise}',
            '{nom_utilisateur}'
        ], [
            $event['name'],
            $businessInfo,
            $user->name
        ], $template);
    }

    /**
     * Obtenir la liste des événements saisonniers
     */
    protected function getSeasonalEvents(): array
    {
        return [
            [
                'name' => 'Nouvel An',
                'date' => '01-01',
                'template' => '🎊 Bonne année ! Que cette nouvelle année vous apporte joie, santé et prospérité. Merci de votre confiance. {entreprise}'
            ],
            [
                'name' => 'Saint-Valentin', 
                'date' => '02-14',
                'template' => '💝 Joyeuse Saint-Valentin ! Célébrez l\'amour avec vos proches. {entreprise} vous accompagne dans tous vos moments précieux.'
            ],
            [
                'name' => 'Fête des Mères',
                'date' => '05-26', // Dernier dimanche de mai (approximatif)
                'template' => '👩 Bonne Fête des Mères ! Honneur à toutes les mamans exceptionnelles. {entreprise}'
            ],
            [
                'name' => 'Fête des Pères',
                'date' => '06-16', // 3ème dimanche de juin (approximatif)
                'template' => '👨 Bonne Fête des Pères ! Célébrons tous les papas formidables. {entreprise}'
            ],
            [
                'name' => 'Rentrée',
                'date' => '09-01',
                'template' => '🎒 Bonne rentrée ! Nouvelle année, nouveaux projets, nouvelles opportunités. {entreprise} vous accompagne.'
            ],
            [
                'name' => 'Halloween',
                'date' => '10-31',
                'template' => '🎃 Joyeux Halloween ! Amusez-vous bien lors de cette soirée mystérieuse. {entreprise}'
            ],
            [
                'name' => 'Noël',
                'date' => '12-25',
                'template' => '🎄 Joyeux Noël ! Que cette fête apporte bonheur et chaleur à votre foyer. Merci pour votre confiance. {entreprise}'
            ]
        ];
    }

    /**
     * Nettoyer les anciennes données
     */
    protected function cleanupOldData(): void
    {
        $this->info('🧹 Nettoyage des anciennes données...');

        try {
            // Supprimer les sessions WhatsApp expirées
            $expiredSessions = \App\Models\WhatsAppAuthSession::where('expires_at', '<', now())->count();
            \App\Models\WhatsAppAuthSession::where('expires_at', '<', now())->delete();
            
            if ($expiredSessions > 0) {
                $this->info("   🗑️  {$expiredSessions} sessions WhatsApp expirées supprimées");
            }

            // Nettoyer les conversations IA très anciennes (> 6 mois)
            $oldConversations = \App\Models\AiConversation::where('last_activity_at', '<', now()->subMonths(6))->count();
            \App\Models\AiConversation::where('last_activity_at', '<', now()->subMonths(6))->delete();
            
            if ($oldConversations > 0) {
                $this->info("   🗑️  {$oldConversations} anciennes conversations IA supprimées");
            }

        } catch (\Exception $e) {
            $this->warn('⚠️  Erreur lors du nettoyage: ' . $e->getMessage());
        }
    }
}
