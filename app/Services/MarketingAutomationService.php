<?php

namespace App\Services;

use App\Models\MarketingAutomationRule;
use App\Models\MarketingClient;
use App\Models\MarketingCampaign;
use App\Models\MarketingMessage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MarketingAutomationService
{
    protected $whatsappService;
    protected $aiService;

    public function __construct(WhatsAppService $whatsappService, AIContentService $aiService)
    {
        $this->whatsappService = $whatsappService;
        $this->aiService = $aiService;
    }

    /**
     * Exécuter toutes les automatisations actives
     */
    public function executeAllAutomations(): array
    {
        $results = [
            'total_rules' => 0,
            'executed' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        try {
            $rules = MarketingAutomationRule::active()->get();
            $results['total_rules'] = $rules->count();

            foreach ($rules as $rule) {
                try {
                    if ($rule->execute()) {
                        $results['executed']++;
                    } else {
                        $results['failed']++;
                    }
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = [
                        'rule_id' => $rule->id,
                        'rule_name' => $rule->name,
                        'error' => $e->getMessage(),
                    ];

                    Log::error('Automation rule execution failed', [
                        'rule_id' => $rule->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

        } catch (\Exception $e) {
            Log::error('Marketing automation execution failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $results['errors'][] = [
                'error' => 'Erreur générale : ' . $e->getMessage(),
            ];
        }

        return $results;
    }

    /**
     * Exécuter les automatisations d'anniversaire
     */
    public function executeBirthdayAutomations(): array
    {
        $results = [
            'clients_with_birthday' => 0,
            'messages_sent' => 0,
            'errors' => [],
        ];

        try {
            // Récupérer les règles d'anniversaire actives
            $birthdayRules = MarketingAutomationRule::active()
                ->ofType('birthday')
                ->get();

            if ($birthdayRules->isEmpty()) {
                return $results;
            }

            // Récupérer les clients avec anniversaire aujourd'hui
            $clientsWithBirthday = MarketingClient::whereRaw("DATE_FORMAT(birthday, '%m-%d') = ?", [
                now()->format('m-d')
            ])->active()->get();

            $results['clients_with_birthday'] = $clientsWithBirthday->count();

            foreach ($birthdayRules as $rule) {
                foreach ($clientsWithBirthday as $client) {
                    if ($client->user_id !== $rule->user_id) {
                        continue;
                    }

                    try {
                        $this->executeBirthdayRule($rule, $client);
                        $results['messages_sent']++;
                    } catch (\Exception $e) {
                        $results['errors'][] = [
                            'client_id' => $client->id,
                            'rule_id' => $rule->id,
                            'error' => $e->getMessage(),
                        ];
                    }
                }
            }

        } catch (\Exception $e) {
            Log::error('Birthday automation execution failed', [
                'error' => $e->getMessage(),
            ]);

            $results['errors'][] = [
                'error' => 'Erreur générale : ' . $e->getMessage(),
            ];
        }

        return $results;
    }

    /**
     * Exécuter les automatisations saisonnières
     */
    public function executeSeasonalAutomations(): array
    {
        $results = [
            'seasonal_rules' => 0,
            'executed' => 0,
            'errors' => [],
        ];

        try {
            $seasonalRules = MarketingAutomationRule::active()
                ->ofType('seasonal')
                ->get();

            $results['seasonal_rules'] = $seasonalRules->count();

            foreach ($seasonalRules as $rule) {
                try {
                    if ($rule->shouldExecute()) {
                        $rule->execute();
                        $results['executed']++;
                    }
                } catch (\Exception $e) {
                    $results['errors'][] = [
                        'rule_id' => $rule->id,
                        'rule_name' => $rule->name,
                        'error' => $e->getMessage(),
                    ];
                }
            }

        } catch (\Exception $e) {
            Log::error('Seasonal automation execution failed', [
                'error' => $e->getMessage(),
            ]);

            $results['errors'][] = [
                'error' => 'Erreur générale : ' . $e->getMessage(),
            ];
        }

        return $results;
    }

    /**
     * Exécuter les automatisations pour nouveaux clients
     */
    public function executeNewClientAutomations(): array
    {
        $results = [
            'new_clients' => 0,
            'automations_triggered' => 0,
            'errors' => [],
        ];

        try {
            $newClientRules = MarketingAutomationRule::active()
                ->ofType('new_client')
                ->get();

            if ($newClientRules->isEmpty()) {
                return $results;
            }

            foreach ($newClientRules as $rule) {
                $hoursThreshold = $rule->trigger_conditions['hours_threshold'] ?? 24;
                
                $newClients = MarketingClient::where('user_id', $rule->user_id)
                    ->active()
                    ->where('created_at', '>=', now()->subHours($hoursThreshold))
                    ->get();

                $results['new_clients'] += $newClients->count();

                foreach ($newClients as $client) {
                    try {
                        $this->executeNewClientRule($rule, $client);
                        $results['automations_triggered']++;
                    } catch (\Exception $e) {
                        $results['errors'][] = [
                            'client_id' => $client->id,
                            'rule_id' => $rule->id,
                            'error' => $e->getMessage(),
                        ];
                    }
                }
            }

        } catch (\Exception $e) {
            Log::error('New client automation execution failed', [
                'error' => $e->getMessage(),
            ]);

            $results['errors'][] = [
                'error' => 'Erreur générale : ' . $e->getMessage(),
            ];
        }

        return $results;
    }

    /**
     * Exécuter les automatisations pour clients inactifs
     */
    public function executeInactiveClientAutomations(): array
    {
        $results = [
            'inactive_clients' => 0,
            'automations_triggered' => 0,
            'errors' => [],
        ];

        try {
            $inactiveRules = MarketingAutomationRule::active()
                ->ofType('inactive_client')
                ->get();

            if ($inactiveRules->isEmpty()) {
                return $results;
            }

            foreach ($inactiveRules as $rule) {
                $daysThreshold = $rule->trigger_conditions['days_threshold'] ?? 30;
                
                $inactiveClients = MarketingClient::where('user_id', $rule->user_id)
                    ->active()
                    ->where(function($query) use ($daysThreshold) {
                        $query->whereNull('last_contact_at')
                              ->orWhere('last_contact_at', '<=', now()->subDays($daysThreshold));
                    })
                    ->get();

                $results['inactive_clients'] += $inactiveClients->count();

                foreach ($inactiveClients as $client) {
                    try {
                        $this->executeInactiveClientRule($rule, $client);
                        $results['automations_triggered']++;
                    } catch (\Exception $e) {
                        $results['errors'][] = [
                            'client_id' => $client->id,
                            'rule_id' => $rule->id,
                            'error' => $e->getMessage(),
                        ];
                    }
                }
            }

        } catch (\Exception $e) {
            Log::error('Inactive client automation execution failed', [
                'error' => $e->getMessage(),
            ]);

            $results['errors'][] = [
                'error' => 'Erreur générale : ' . $e->getMessage(),
            ];
        }

        return $results;
    }

    /**
     * Exécuter une règle d'anniversaire
     */
    protected function executeBirthdayRule(MarketingAutomationRule $rule, MarketingClient $client): void
    {
        $actionData = $rule->action_data;
        $message = $actionData['message'] ?? '';

        // Personnaliser le message
        $message = $this->personalizeMessage($message, $client);

        // Utiliser l'IA si configuré
        if ($rule->use_ai && $rule->ai_settings) {
            $aiMessage = $this->aiService->generatePersonalizedMessage($message, [
                'occasion' => 'anniversaire',
                'client_name' => $client->name,
                'client_birthday' => $client->birthday?->format('d/m'),
            ]);

            if ($aiMessage) {
                $message = $aiMessage;
            }
        }

        // Envoyer le message
        $this->whatsappService->sendMessage($client, $message, [
            'automation_rule_id' => $rule->id,
            'type' => 'birthday_automation',
        ]);
    }

    /**
     * Exécuter une règle pour nouveau client
     */
    protected function executeNewClientRule(MarketingAutomationRule $rule, MarketingClient $client): void
    {
        $actionData = $rule->action_data;
        $message = $actionData['message'] ?? '';

        // Personnaliser le message
        $message = $this->personalizeMessage($message, $client);

        // Utiliser l'IA si configuré
        if ($rule->use_ai && $rule->ai_settings) {
            $aiMessage = $this->aiService->generatePersonalizedMessage($message, [
                'occasion' => 'nouveau_client',
                'client_name' => $client->name,
                'welcome_message' => true,
            ]);

            if ($aiMessage) {
                $message = $aiMessage;
            }
        }

        // Envoyer le message
        $this->whatsappService->sendMessage($client, $message, [
            'automation_rule_id' => $rule->id,
            'type' => 'new_client_automation',
        ]);
    }

    /**
     * Exécuter une règle pour client inactif
     */
    protected function executeInactiveClientRule(MarketingAutomationRule $rule, MarketingClient $client): void
    {
        $actionData = $rule->action_data;
        $message = $actionData['message'] ?? '';

        // Personnaliser le message
        $message = $this->personalizeMessage($message, $client);

        // Utiliser l'IA si configuré
        if ($rule->use_ai && $rule->ai_settings) {
            $aiMessage = $this->aiService->generatePersonalizedMessage($message, [
                'occasion' => 'reactivation',
                'client_name' => $client->name,
                'days_inactive' => $client->last_contact_at ? $client->last_contact_at->diffInDays(now()) : 'inconnu',
            ]);

            if ($aiMessage) {
                $message = $aiMessage;
            }
        }

        // Envoyer le message
        $this->whatsappService->sendMessage($client, $message, [
            'automation_rule_id' => $rule->id,
            'type' => 'inactive_client_automation',
        ]);
    }

    /**
     * Personnaliser un message avec les données du client
     */
    protected function personalizeMessage(string $message, MarketingClient $client): string
    {
        $replacements = [
            '{nom}' => $client->name,
            '{prenom}' => explode(' ', $client->name)[0] ?? '',
            '{telephone}' => $client->phone,
            '{email}' => $client->email ?? '',
            '{anniversaire}' => $client->birthday ? $client->birthday->format('d/m') : '',
            '{tags}' => implode(', ', $client->tags ?? []),
            '{dernier_contact}' => $client->last_contact_at ? $client->last_contact_at->diffForHumans() : 'jamais',
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }

    /**
     * Créer une règle d'automatisation d'anniversaire
     */
    public function createBirthdayRule(int $userId, string $name, array $settings = []): MarketingAutomationRule
    {
        $defaultSettings = [
            'days_ahead' => 0, // 0 = jour même, 1 = jour avant, etc.
            'message' => '🎉 Joyeux anniversaire {nom} ! Nous vous souhaitons une excellente journée !',
            'use_ai' => false,
        ];

        $settings = array_merge($defaultSettings, $settings);

        return MarketingAutomationRule::create([
            'user_id' => $userId,
            'name' => $name,
            'description' => 'Envoi automatique de messages d\'anniversaire',
            'trigger_type' => 'birthday',
            'trigger_conditions' => [
                'days_ahead' => $settings['days_ahead'],
            ],
            'action_type' => 'send_whatsapp',
            'action_data' => [
                'message' => $settings['message'],
                'use_ai' => $settings['use_ai'],
            ],
            'status' => 'active',
            'use_ai' => $settings['use_ai'],
        ]);
    }

    /**
     * Créer une règle d'automatisation saisonnière
     */
    public function createSeasonalRule(int $userId, string $name, array $dates, array $settings = []): MarketingAutomationRule
    {
        $defaultSettings = [
            'message' => '🎊 Bonne fête ! Nous pensons à vous en cette occasion spéciale.',
            'use_ai' => false,
        ];

        $settings = array_merge($defaultSettings, $settings);

        return MarketingAutomationRule::create([
            'user_id' => $userId,
            'name' => $name,
            'description' => 'Envoi automatique de messages saisonniers',
            'trigger_type' => 'seasonal',
            'trigger_conditions' => [
                'dates' => $dates,
            ],
            'action_type' => 'send_whatsapp',
            'action_data' => [
                'message' => $settings['message'],
                'use_ai' => $settings['use_ai'],
            ],
            'status' => 'active',
            'use_ai' => $settings['use_ai'],
        ]);
    }

    /**
     * Créer une règle d'automatisation pour nouveaux clients
     */
    public function createNewClientRule(int $userId, string $name, array $settings = []): MarketingAutomationRule
    {
        $defaultSettings = [
            'hours_threshold' => 24,
            'message' => '👋 Bienvenue {nom} ! Nous sommes ravis de vous compter parmi nos clients.',
            'use_ai' => false,
        ];

        $settings = array_merge($defaultSettings, $settings);

        return MarketingAutomationRule::create([
            'user_id' => $userId,
            'name' => $name,
            'description' => 'Envoi automatique de messages de bienvenue',
            'trigger_type' => 'new_client',
            'trigger_conditions' => [
                'hours_threshold' => $settings['hours_threshold'],
            ],
            'action_type' => 'send_whatsapp',
            'action_data' => [
                'message' => $settings['message'],
                'use_ai' => $settings['use_ai'],
            ],
            'status' => 'active',
            'use_ai' => $settings['use_ai'],
        ]);
    }

    /**
     * Créer une règle d'automatisation pour clients inactifs
     */
    public function createInactiveClientRule(int $userId, string $name, array $settings = []): MarketingAutomationRule
    {
        $defaultSettings = [
            'days_threshold' => 30,
            'message' => '👋 Bonjour {nom} ! Nous ne vous avons pas vu depuis un moment. Comment allez-vous ?',
            'use_ai' => false,
        ];

        $settings = array_merge($defaultSettings, $settings);

        return MarketingAutomationRule::create([
            'user_id' => $userId,
            'name' => $name,
            'description' => 'Envoi automatique de messages de réactivation',
            'trigger_type' => 'inactive_client',
            'trigger_conditions' => [
                'days_threshold' => $settings['days_threshold'],
            ],
            'action_type' => 'send_whatsapp',
            'action_data' => [
                'message' => $settings['message'],
                'use_ai' => $settings['use_ai'],
            ],
            'status' => 'active',
            'use_ai' => $settings['use_ai'],
        ]);
    }

    /**
     * Obtenir les statistiques d'automatisation
     */
    public function getAutomationStats(int $userId, string $period = 'month'): array
    {
        $query = MarketingAutomationRule::where('user_id', $userId);

        $totalRules = $query->count();
        $activeRules = $query->where('status', 'active')->count();
        $inactiveRules = $query->where('status', 'inactive')->count();

        // Statistiques d'exécution
        $executionStats = MarketingAutomationRule::where('user_id', $userId)
            ->selectRaw('
                COUNT(*) as total_rules,
                SUM(execution_count) as total_executions,
                AVG(execution_count) as avg_executions,
                MAX(last_executed_at) as last_execution
            ')
            ->first();

        return [
            'total_rules' => $totalRules,
            'active_rules' => $activeRules,
            'inactive_rules' => $inactiveRules,
            'total_executions' => $executionStats->total_executions ?? 0,
            'avg_executions' => round($executionStats->avg_executions ?? 0, 2),
            'last_execution' => $executionStats->last_execution,
            'execution_rate' => $totalRules > 0 ? round(($activeRules / $totalRules) * 100, 2) : 0,
        ];
    }

    /**
     * Obtenir les règles prêtes à l'exécution
     */
    public function getRulesReadyForExecution(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return MarketingAutomationRule::where('user_id', $userId)
            ->active()
            ->where(function($query) {
                $query->whereNull('last_executed_at')
                      ->orWhere('last_executed_at', '<=', now()->subHours(1));
            })
            ->get();
    }

    /**
     * Nettoyer les anciennes règles
     */
    public function cleanupOldRules(int $daysOld = 90): int
    {
        $cutoffDate = now()->subDays($daysOld);
        
        return MarketingAutomationRule::where('created_at', '<', $cutoffDate)
            ->where('status', 'inactive')
            ->where('execution_count', 0)
            ->delete();
    }
}