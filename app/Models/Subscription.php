<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
        'plan',
        'starts_at',
        'expires_at',
        'status',
        'clients_limit',
        'campaigns_limit',
        'campaign_sms_limit',
        'personal_sms_quota',
        'sms_used',
        'campaigns_used',
        'next_renewal_date',
        'auto_renew',
        'features'
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'next_renewal_date' => 'date',
        'auto_renew' => 'boolean',
        'features' => 'array'
    ];

    /**
     * Get the user that owns the subscription.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the plan associated with this subscription.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    /**
     * Calculate the percentage of SMS used
     */
    public function getSmsUsagePercentAttribute(): float
    {
        if ($this->personal_sms_quota <= 0) {
            return 0;
        }
        
        return min(100, round(($this->sms_used / $this->personal_sms_quota) * 100, 2));
    }

    /**
     * Calculate the percentage of campaigns used
     */
    public function getCampaignsUsagePercentAttribute(): float
    {
        if ($this->campaigns_limit <= 0) {
            return 0;
        }
        
        return min(100, round(($this->campaigns_used / $this->campaigns_limit) * 100, 2));
    }

    /**
     * Check if SMS quota is running low (80% or more)
     */
    public function getSmsQuotaLowAttribute(): bool
    {
        return $this->sms_usage_percent >= 80;
    }

    /**
     * Check if SMS quota is exhausted
     */
    public function getSmsQuotaExhaustedAttribute(): bool
    {
        return $this->sms_used >= $this->personal_sms_quota;
    }

    /**
     * Vérifie si l'abonnement est actif
     * 
     * @return bool
     */
    public function isActive(): bool
    {
        // Vérifie si la date d'expiration est dans le futur et que le statut est actif
        return $this->expires_at > now() && $this->status === 'active';
    }
} 