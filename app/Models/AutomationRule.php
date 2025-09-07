<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class AutomationRule extends Model
{
    use HasFactory;

    const TRIGGER_BIRTHDAY = 'birthday';
    const TRIGGER_ANNIVERSARY = 'anniversary';
    const TRIGGER_SEASONAL = 'seasonal';
    const TRIGGER_INACTIVITY = 'inactivity';
    const TRIGGER_NEW_CLIENT = 'new_client';
    const TRIGGER_PURCHASE = 'purchase';
    const TRIGGER_TIME_BASED = 'time_based';
    const TRIGGER_WEBHOOK = 'webhook';

    const ACTION_SEND_SMS = 'send_sms';
    const ACTION_SEND_EMAIL = 'send_email';
    const ACTION_SEND_WHATSAPP = 'send_whatsapp';
    const ACTION_CREATE_REMINDER = 'create_reminder';
    const ACTION_ADD_TAG = 'add_tag';
    const ACTION_REMOVE_TAG = 'remove_tag';
    const ACTION_GENERATE_CONTENT = 'generate_content';

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_PAUSED = 'paused';
    const STATUS_ERROR = 'error';

    const FREQUENCY_ONCE = 'once';
    const FREQUENCY_DAILY = 'daily';
    const FREQUENCY_WEEKLY = 'weekly';
    const FREQUENCY_MONTHLY = 'monthly';
    const FREQUENCY_YEARLY = 'yearly';

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'trigger_type',
        'trigger_conditions',
        'action_type',
        'action_data',
        'status',
        'delay_hours',
        'last_executed_at',
        'next_execution_at',
        'execution_count',
        'success_count',
        'failure_count',
        'priority',
        'frequency',
        'is_recurring',
        'tags'
    ];

    protected $casts = [
        'trigger_conditions' => 'array',
        'action_data' => 'array',
        'last_executed_at' => 'datetime',
        'next_execution_at' => 'datetime',
        'execution_count' => 'integer',
        'success_count' => 'integer',
        'failure_count' => 'integer',
        'priority' => 'integer',
        'is_recurring' => 'boolean',
        'tags' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function executions()
    {
        return $this->hasMany(AutomationExecution::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function shouldExecute(Client $client): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        return match($this->trigger_type) {
            self::TRIGGER_BIRTHDAY => $this->checkBirthdayTrigger($client),
            self::TRIGGER_ANNIVERSARY => $this->checkAnniversaryTrigger($client),
            self::TRIGGER_SEASONAL => $this->checkSeasonalTrigger(),
            self::TRIGGER_INACTIVITY => $this->checkInactivityTrigger($client),
            self::TRIGGER_NEW_CLIENT => $this->checkNewClientTrigger($client),
            default => false
        };
    }

    private function checkBirthdayTrigger(Client $client): bool
    {
        if (!$client->birthday) return false;
        
        $daysAhead = $this->trigger_conditions['days_ahead'] ?? 0;
        $targetDate = $client->birthday->setYear(now()->year);
        
        if ($targetDate->isPast()) {
            $targetDate->addYear();
        }
        
        return $targetDate->diffInDays(now()) === $daysAhead;
    }

    private function checkAnniversaryTrigger(Client $client): bool
    {
        $daysAhead = $this->trigger_conditions['days_ahead'] ?? 0;
        $anniversaryDate = $client->created_at->setYear(now()->year);
        
        if ($anniversaryDate->isPast()) {
            $anniversaryDate->addYear();
        }
        
        return $anniversaryDate->diffInDays(now()) === $daysAhead;
    }

    private function checkSeasonalTrigger(): bool
    {
        $season = $this->trigger_conditions['season'] ?? '';
        $targetDate = $this->trigger_conditions['date'] ?? '';
        
        return now()->format('m-d') === $targetDate;
    }

    private function checkInactivityTrigger(Client $client): bool
    {
        $days = $this->trigger_conditions['days_inactive'] ?? 30;
        return $client->messages()->where('created_at', '>=', now()->subDays($days))->count() === 0;
    }

    private function checkNewClientTrigger(Client $client): bool
    {
        $hours = $this->trigger_conditions['hours_after_creation'] ?? 24;
        return $client->created_at->diffInHours(now()) >= $hours;
    }

    /**
     * Relations
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeDueForExecution($query)
    {
        return $query->active()
            ->where(function ($q) {
                $q->whereNull('next_execution_at')
                  ->orWhere('next_execution_at', '<=', now());
            });
    }

    /**
     * Accesseurs
     */
    public function getSuccessRateAttribute(): float
    {
        if ($this->execution_count === 0) {
            return 0.0;
        }

        return round(($this->success_count / $this->execution_count) * 100, 1);
    }

    /**
     * Méthodes de gestion améliorées
     */
    public function execute(): array
    {
        if (!$this->shouldExecuteRule()) {
            return [
                'success' => false,
                'message' => 'Les conditions d\'exécution ne sont pas remplies'
            ];
        }

        try {
            $result = $this->performAction();
            $this->incrementExecution($result['success']);
            
            return $result;
        } catch (\Exception $e) {
            $this->incrementExecution(false);
            $this->markAsError($e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Erreur lors de l\'exécution: ' . $e->getMessage()
            ];
        }
    }

    protected function shouldExecuteRule(): bool
    {
        if ($this->status !== self::STATUS_ACTIVE) {
            return false;
        }

        if ($this->next_execution_at && $this->next_execution_at->isFuture()) {
            return false;
        }

        return true;
    }

    protected function performAction(): array
    {
        $actionData = $this->action_data ?? [];
        
        switch ($this->action_type) {
            case self::ACTION_SEND_WHATSAPP:
                return $this->sendWhatsAppMessage($actionData);
            
            case self::ACTION_GENERATE_CONTENT:
                return $this->generateContent($actionData);
            
            default:
                return [
                    'success' => false,
                    'message' => 'Type d\'action non supporté: ' . $this->action_type
                ];
        }
    }

    protected function sendWhatsAppMessage(array $data): array
    {
        $whatsappService = app(\App\Services\WhatsAppService::class);
        $message = $data['message'] ?? '';
        $useAI = $data['use_ai'] ?? false;
        
        $clients = $this->getTargetClients();
        $results = [];
        
        foreach ($clients as $client) {
            if (!$client->phone) {
                continue;
            }
            
            $finalMessage = $message;
            
            if ($useAI) {
                $aiService = app(\App\Services\AIContentService::class);
                $personalizedResult = $aiService->personalizeMessage($client, $message);
                
                if ($personalizedResult['success']) {
                    $finalMessage = $personalizedResult['personalized_message'];
                }
            }
            
            $result = $whatsappService->sendMessage($client->phone, $finalMessage);
            $results[] = array_merge($result, ['client_id' => $client->id]);
        }
        
        $successCount = count(array_filter($results, fn($r) => $r['success']));
        
        return [
            'success' => $successCount > 0,
            'message' => "Messages envoyés: {$successCount}/" . count($results),
            'results' => $results
        ];
    }

    protected function generateContent(array $data): array
    {
        $aiService = app(\App\Services\AIContentService::class);
        $contentType = $data['content_type'] ?? 'social_post';
        $topic = $data['topic'] ?? 'Contenu automatisé';
        
        $result = $aiService->generateSocialPost($topic, 'facebook', 'engaging', [], $this->user);
        
        return [
            'success' => $result['success'],
            'message' => $result['success'] ? 'Contenu généré avec succès' : 'Erreur génération contenu',
            'content' => $result['content'] ?? null
        ];
    }

    protected function getTargetClients()
    {
        $conditions = $this->trigger_conditions ?? [];
        $query = $this->user->clients();
        
        switch ($this->trigger_type) {
            case self::TRIGGER_BIRTHDAY:
                $daysAhead = $conditions['days_ahead'] ?? 0;
                $targetDate = now()->addDays($daysAhead);
                return $query->whereRaw('DATE_FORMAT(birthday, "%m-%d") = ?', [$targetDate->format('m-d')])->get();
            
            case self::TRIGGER_INACTIVITY:
                $days = $conditions['inactivity_days'] ?? 30;
                $cutoffDate = now()->subDays($days);
                return $query->where(function ($q) use ($cutoffDate) {
                    $q->where('last_visit', '<', $cutoffDate)->orWhereNull('last_visit');
                })->get();
            
            default:
                return $query->get();
        }
    }

    public function incrementExecution(bool $success = true): void
    {
        if ($success) {
            $this->increment('success_count');
        } else {
            $this->increment('failure_count');
        }
        
        $this->increment('execution_count');
        $this->update(['last_executed_at' => now()]);
        
        if ($this->is_recurring) {
            $this->calculateNextExecution();
        }
    }

    public function calculateNextExecution(): void
    {
        if (!$this->is_recurring || $this->status !== self::STATUS_ACTIVE) {
            return;
        }

        $baseDate = $this->last_executed_at ?? now();
        $nextExecution = null;

        switch ($this->frequency) {
            case self::FREQUENCY_DAILY:
                $nextExecution = $baseDate->addDay();
                break;
            case self::FREQUENCY_WEEKLY:
                $nextExecution = $baseDate->addWeek();
                break;
            case self::FREQUENCY_MONTHLY:
                $nextExecution = $baseDate->addMonth();
                break;
            case self::FREQUENCY_YEARLY:
                $nextExecution = $baseDate->addYear();
                break;
        }

        if ($nextExecution) {
            $this->update(['next_execution_at' => $nextExecution]);
        }
    }

    public function markAsError(string $errorMessage = null): void
    {
        $this->update(['status' => self::STATUS_ERROR]);
        
        if ($errorMessage) {
            \Illuminate\Support\Facades\Log::error("Automation rule error: {$errorMessage}", [
                'rule_id' => $this->id,
                'rule_name' => $this->name,
                'trigger_type' => $this->trigger_type
            ]);
        }
    }

    public function shouldExecute($client): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        return match($this->trigger_type) {
            self::TRIGGER_BIRTHDAY => $this->checkBirthdayTrigger($client),
            self::TRIGGER_ANNIVERSARY => $this->checkAnniversaryTrigger($client),
            self::TRIGGER_SEASONAL => $this->checkSeasonalTrigger(),
            self::TRIGGER_INACTIVITY => $this->checkInactivityTrigger($client),
            self::TRIGGER_NEW_CLIENT => $this->checkNewClientTrigger($client),
            default => false
        };
    }