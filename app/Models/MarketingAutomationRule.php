<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class MarketingAutomationRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'trigger_type',
        'trigger_conditions',
        'action_type',
        'action_data',
        'status',
        'use_ai',
        'ai_settings',
        'last_executed_at',
        'execution_count',
    ];

    protected $casts = [
        'trigger_conditions' => 'array',
        'action_data' => 'array',
        'ai_settings' => 'array',
        'last_executed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isInactive(): bool
    {
        return $this->status === 'inactive';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function activate(): void
    {
        $this->update(['status' => 'active']);
    }

    public function deactivate(): void
    {
        $this->update(['status' => 'inactive']);
    }

    public function shouldExecute(): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        switch ($this->trigger_type) {
            case 'birthday':
                return $this->shouldExecuteBirthday();
            case 'new_client':
                return $this->shouldExecuteNewClient();
            case 'inactive_client':
                return $this->shouldExecuteInactiveClient();
            case 'seasonal':
                return $this->shouldExecuteSeasonal();
            case 'custom_date':
                return $this->shouldExecuteCustomDate();
            case 'event':
                return $this->shouldExecuteEvent();
            default:
                return false;
        }
    }

    private function shouldExecuteBirthday(): bool
    {
        $daysAhead = $this->trigger_conditions['days_ahead'] ?? 0;
        
        // Vérifier si on a des clients avec anniversaire dans X jours
        $clients = MarketingClient::where('user_id', $this->user_id)
            ->active()
            ->withBirthdayInDays($daysAhead)
            ->count();
            
        return $clients > 0;
    }

    private function shouldExecuteNewClient(): bool
    {
        $hoursThreshold = $this->trigger_conditions['hours_threshold'] ?? 24;
        
        $clients = MarketingClient::where('user_id', $this->user_id)
            ->active()
            ->where('created_at', '>=', now()->subHours($hoursThreshold))
            ->count();
            
        return $clients > 0;
    }

    private function shouldExecuteInactiveClient(): bool
    {
        $daysThreshold = $this->trigger_conditions['days_threshold'] ?? 30;
        
        $clients = MarketingClient::where('user_id', $this->user_id)
            ->active()
            ->where(function($query) use ($daysThreshold) {
                $query->whereNull('last_contact_at')
                      ->orWhere('last_contact_at', '<=', now()->subDays($daysThreshold));
            })
            ->count();
            
        return $clients > 0;
    }

    private function shouldExecuteSeasonal(): bool
    {
        $seasonalDates = $this->trigger_conditions['dates'] ?? [];
        $today = now()->format('m-d');
        
        return in_array($today, $seasonalDates);
    }

    private function shouldExecuteCustomDate(): bool
    {
        $customDates = $this->trigger_conditions['dates'] ?? [];
        $today = now()->format('Y-m-d');
        
        return in_array($today, $customDates);
    }

    private function shouldExecuteEvent(): bool
    {
        // Logique pour les événements personnalisés
        return false;
    }

    public function execute(): bool
    {
        if (!$this->shouldExecute()) {
            return false;
        }

        try {
            $this->performAction();
            
            $this->update([
                'last_executed_at' => now(),
                'execution_count' => $this->execution_count + 1,
            ]);
            
            return true;
        } catch (\Exception $e) {
            \Log::error('Automation rule execution failed', [
                'rule_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    private function performAction(): void
    {
        switch ($this->action_type) {
            case 'send_whatsapp':
                $this->performWhatsAppAction();
                break;
            case 'send_email':
                $this->performEmailAction();
                break;
            case 'create_campaign':
                $this->performCampaignAction();
                break;
            case 'send_notification':
                $this->performNotificationAction();
                break;
        }
    }

    private function performWhatsAppAction(): void
    {
        $actionData = $this->action_data;
        $message = $actionData['message'] ?? '';
        
        if ($this->use_ai && $this->ai_settings) {
            $aiService = app(\App\Services\AIContentService::class);
            $message = $aiService->generatePersonalizedMessage($message, $this->ai_settings);
        }
        
        // Récupérer les clients cibles selon le type de déclencheur
        $clients = $this->getTargetClients();
        
        foreach ($clients as $client) {
            $personalizedMessage = $this->personalizeMessage($message, $client);
            
            $whatsappService = app(\App\Services\WhatsAppService::class);
            $whatsappService->sendMessage($client, $personalizedMessage);
        }
    }

    private function performEmailAction(): void
    {
        // Implémentation pour l'envoi d'emails
    }

    private function performCampaignAction(): void
    {
        // Implémentation pour la création de campagnes
    }

    private function performNotificationAction(): void
    {
        // Implémentation pour les notifications
    }

    private function getTargetClients()
    {
        switch ($this->trigger_type) {
            case 'birthday':
                $daysAhead = $this->trigger_conditions['days_ahead'] ?? 0;
                return MarketingClient::where('user_id', $this->user_id)
                    ->active()
                    ->withBirthdayInDays($daysAhead)
                    ->get();
                    
            case 'new_client':
                $hoursThreshold = $this->trigger_conditions['hours_threshold'] ?? 24;
                return MarketingClient::where('user_id', $this->user_id)
                    ->active()
                    ->where('created_at', '>=', now()->subHours($hoursThreshold))
                    ->get();
                    
            case 'inactive_client':
                $daysThreshold = $this->trigger_conditions['days_threshold'] ?? 30;
                return MarketingClient::where('user_id', $this->user_id)
                    ->active()
                    ->where(function($query) use ($daysThreshold) {
                        $query->whereNull('last_contact_at')
                              ->orWhere('last_contact_at', '<=', now()->subDays($daysThreshold));
                    })
                    ->get();
                    
            default:
                return collect();
        }
    }

    private function personalizeMessage(string $message, MarketingClient $client): string
    {
        $replacements = [
            '{nom}' => $client->name,
            '{prenom}' => explode(' ', $client->name)[0] ?? '',
            '{telephone}' => $client->phone,
            '{email}' => $client->email ?? '',
            '{anniversaire}' => $client->birthday ? $client->birthday->format('d/m') : '',
        ];
        
        return str_replace(array_keys($replacements), array_values($replacements), $message);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOfType($query, string $triggerType)
    {
        return $query->where('trigger_type', $triggerType);
    }

    public function scopeReadyToExecute($query)
    {
        return $query->where('status', 'active');
    }
}