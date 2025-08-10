<?php

namespace App\Services;

use App\Models\Client;
use App\Models\AutomationRule;
use App\Models\AutomationExecution;
use App\Services\WhatsAppService;
use App\Services\AIContentService;
use Illuminate\Support\Facades\Log;

class AutomationService
{
    private WhatsAppService $whatsappService;
    private AIContentService $aiService;

    public function __construct(WhatsAppService $whatsappService, AIContentService $aiService)
    {
        $this->whatsappService = $whatsappService;
        $this->aiService = $aiService;
    }

    public function executeAllActiveRules(): int
    {
        $executedCount = 0;
        $activeRules = AutomationRule::where('status', AutomationRule::STATUS_ACTIVE)->get();

        foreach ($activeRules as $rule) {
            $executedCount += $this->executeRule($rule);
        }

        return $executedCount;
    }

    public function executeRule(AutomationRule $rule): int
    {
        $executedCount = 0;
        $clients = Client::where('user_id', $rule->user_id)
            ->where('opt_out', false)
            ->get();

        foreach ($clients as $client) {
            if ($rule->shouldExecute($client)) {
                $this->executeRuleForClient($rule, $client);
                $executedCount++;
            }
        }

        return $executedCount;
    }

    private function executeRuleForClient(AutomationRule $rule, Client $client): void
    {
        // Vérifier si cette règle a déjà été exécutée pour ce client récemment
        $recentExecution = AutomationExecution::where('automation_rule_id', $rule->id)
            ->where('client_id', $client->id)
            ->where('created_at', '>=', now()->subDays(1))
            ->first();

        if ($recentExecution) {
            return; // Éviter les doublons
        }

        $execution = AutomationExecution::create([
            'automation_rule_id' => $rule->id,
            'client_id' => $client->id,
            'status' => AutomationExecution::STATUS_PENDING
        ]);

        try {
            match($rule->action_type) {
                AutomationRule::ACTION_SEND_SMS => $this->executeSmsAction($rule, $client, $execution),
                AutomationRule::ACTION_SEND_EMAIL => $this->executeEmailAction($rule, $client, $execution),
                AutomationRule::ACTION_SEND_WHATSAPP => $this->executeWhatsAppAction($rule, $client, $execution),
                AutomationRule::ACTION_CREATE_REMINDER => $this->executeReminderAction($rule, $client, $execution),
                AutomationRule::ACTION_ADD_TAG => $this->executeAddTagAction($rule, $client, $execution),
                default => throw new \Exception("Action type not supported: {$rule->action_type}")
            };

            $rule->incrementExecution();

        } catch (\Exception $e) {
            Log::error("Automation execution failed for rule {$rule->id}, client {$client->id}: " . $e->getMessage());
            $execution->markAsFailed($e->getMessage());
        }
    }

    private function executeSmsAction(AutomationRule $rule, Client $client, AutomationExecution $execution): void
    {
        $actionData = $rule->action_data;
        $messageTemplate = $actionData['message'] ?? '';
        
        // Générer message personnalisé avec IA si demandé
        if ($actionData['use_ai'] ?? false) {
            $aiResult = $this->aiService->generatePersonalizedMessage(
                $client, 
                $rule->trigger_type,
                isset($actionData['template_id']) ? \App\Models\ContentTemplate::find($actionData['template_id']) : null
            );
            
            if ($aiResult['success']) {
                $messageTemplate = $aiResult['message'];
            }
        }

        // Remplacer les variables dans le message
        $message = $this->replaceVariables($messageTemplate, $client);
        
        // Envoyer via Twilio SMS (à implémenter)
        // Pour l'instant, on utilise WhatsApp
        $result = $this->whatsappService->sendMessage($client, $message, $rule->user_id);
        
        $execution->markAsExecuted([
            'message_sent' => $message,
            'message_id' => $result->id
        ]);
    }

    private function executeEmailAction(AutomationRule $rule, Client $client, AutomationExecution $execution): void
    {
        $actionData = $rule->action_data;
        $subject = $actionData['subject'] ?? 'Message automatique';
        $messageTemplate = $actionData['message'] ?? '';
        
        // Générer contenu avec IA si demandé
        if ($actionData['use_ai'] ?? false) {
            $aiResult = $this->aiService->generatePersonalizedMessage($client, $rule->trigger_type);
            if ($aiResult['success']) {
                $messageTemplate = $aiResult['message'];
            }
        }

        $message = $this->replaceVariables($messageTemplate, $client);
        $subject = $this->replaceVariables($subject, $client);
        
        // Envoyer email (à implémenter avec Laravel Mail)
        // \Mail::to($client->email)->send(new AutomationEmail($subject, $message));
        
        $execution->markAsExecuted([
            'subject' => $subject,
            'message_sent' => $message
        ]);
    }

    private function executeWhatsAppAction(AutomationRule $rule, Client $client, AutomationExecution $execution): void
    {
        $actionData = $rule->action_data;
        $messageTemplate = $actionData['message'] ?? '';
        
        // Générer message personnalisé avec IA si demandé
        if ($actionData['use_ai'] ?? false) {
            $aiResult = $this->aiService->generatePersonalizedMessage($client, $rule->trigger_type);
            if ($aiResult['success']) {
                $messageTemplate = $aiResult['message'];
            }
        }

        $message = $this->replaceVariables($messageTemplate, $client);
        
        // Envoyer via WhatsApp
        $result = $this->whatsappService->sendMessage($client, $message, $rule->user_id);
        
        $execution->markAsExecuted([
            'message_sent' => $message,
            'message_id' => $result->id,
            'platform' => 'whatsapp'
        ]);
    }

    private function executeReminderAction(AutomationRule $rule, Client $client, AutomationExecution $execution): void
    {
        $actionData = $rule->action_data;
        $reminderText = $actionData['reminder'] ?? '';
        $reminderDate = now()->addDays($actionData['days_ahead'] ?? 1);
        
        // Créer un rappel (à implémenter avec un modèle Reminder)
        // Reminder::create([...]);
        
        $execution->markAsExecuted([
            'reminder_created' => $reminderText,
            'reminder_date' => $reminderDate
        ]);
    }

    private function executeAddTagAction(AutomationRule $rule, Client $client, AutomationExecution $execution): void
    {
        $actionData = $rule->action_data;
        $tagNames = $actionData['tags'] ?? [];
        
        foreach ($tagNames as $tagName) {
            $client->attachTag($tagName);
        }
        
        $execution->markAsExecuted([
            'tags_added' => $tagNames
        ]);
    }

    private function replaceVariables(string $template, Client $client): string
    {
        $variables = [
            '{nom}' => $client->name,
            '{prénom}' => explode(' ', $client->name)[0] ?? $client->name,
            '{email}' => $client->email ?? '',
            '{téléphone}' => $client->phone ?? '',
            '{date}' => now()->format('d/m/Y'),
            '{heure}' => now()->format('H:i'),
            '{anniversaire}' => $client->birthday ? $client->birthday->format('d/m') : '',
        ];

        return str_replace(array_keys($variables), array_values($variables), $template);
    }

    public function createBirthdayReminders(): int
    {
        $count = 0;
        $clientsWithBirthdays = Client::whereNotNull('birthday')
            ->where('opt_out', false)
            ->get();

        foreach ($clientsWithBirthdays as $client) {
            // Vérifier si l'anniversaire est dans 7 jours
            $birthday = $client->birthday->setYear(now()->year);
            if ($birthday->isPast()) {
                $birthday->addYear();
            }

            if ($birthday->diffInDays(now()) === 7) {
                // Créer une règle d'automatisation temporaire pour ce client
                $this->createTemporaryBirthdayRule($client);
                $count++;
            }
        }

        return $count;
    }

    private function createTemporaryBirthdayRule(Client $client): void
    {
        AutomationRule::create([
            'user_id' => $client->user_id,
            'name' => "Anniversaire de {$client->name}",
            'description' => "Message d'anniversaire automatique",
            'trigger_type' => AutomationRule::TRIGGER_BIRTHDAY,
            'trigger_conditions' => ['days_ahead' => 0],
            'action_type' => AutomationRule::ACTION_SEND_WHATSAPP,
            'action_data' => [
                'message' => "🎉 Joyeux anniversaire {nom} ! Nous vous souhaitons une excellente journée remplie de bonheur !",
                'use_ai' => true
            ],
            'status' => AutomationRule::STATUS_ACTIVE
        ]);
    }

    public function createSeasonalReminder(string $occasion, string $date, string $message): AutomationRule
    {
        return AutomationRule::create([
            'user_id' => auth()->id(),
            'name' => "Rappel $occasion",
            'description' => "Message automatique pour $occasion",
            'trigger_type' => AutomationRule::TRIGGER_SEASONAL,
            'trigger_conditions' => [
                'season' => $occasion,
                'date' => $date
            ],
            'action_type' => AutomationRule::ACTION_SEND_WHATSAPP,
            'action_data' => [
                'message' => $message,
                'use_ai' => true
            ],
            'status' => AutomationRule::STATUS_ACTIVE
        ]);
    }

    public function getAutomationStatistics(int $userId): array
    {
        $rules = AutomationRule::where('user_id', $userId)->get();
        $executions = AutomationExecution::whereIn('automation_rule_id', $rules->pluck('id'))
            ->where('created_at', '>=', now()->subDays(30))
            ->get();

        return [
            'total_rules' => $rules->count(),
            'active_rules' => $rules->where('status', AutomationRule::STATUS_ACTIVE)->count(),
            'executions_this_month' => $executions->count(),
            'successful_executions' => $executions->where('status', AutomationExecution::STATUS_EXECUTED)->count(),
            'failed_executions' => $executions->where('status', AutomationExecution::STATUS_FAILED)->count(),
            'most_used_trigger' => $rules->groupBy('trigger_type')->sortByDesc->count()->keys()->first(),
            'most_used_action' => $rules->groupBy('action_type')->sortByDesc->count()->keys()->first()
        ];
    }
}