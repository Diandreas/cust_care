<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomationRule extends Model
{
    use HasFactory;

    const TRIGGER_BIRTHDAY = 'birthday';
    const TRIGGER_ANNIVERSARY = 'anniversary';
    const TRIGGER_SEASONAL = 'seasonal';
    const TRIGGER_INACTIVITY = 'inactivity';
    const TRIGGER_NEW_CLIENT = 'new_client';
    const TRIGGER_PURCHASE = 'purchase';

    const ACTION_SEND_SMS = 'send_sms';
    const ACTION_SEND_EMAIL = 'send_email';
    const ACTION_SEND_WHATSAPP = 'send_whatsapp';
    const ACTION_CREATE_REMINDER = 'create_reminder';
    const ACTION_ADD_TAG = 'add_tag';

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_PAUSED = 'paused';

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
        'execution_count'
    ];

    protected $casts = [
        'trigger_conditions' => 'array',
        'action_data' => 'array',
        'last_executed_at' => 'datetime'
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

    public function incrementExecution()
    {
        $this->increment('execution_count');
        $this->update(['last_executed_at' => now()]);
    }
}