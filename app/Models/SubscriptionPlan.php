<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'price',
        'max_clients',
        'max_campaigns_per_month',
        'total_campaign_sms',
        'monthly_sms_quota',
        'unused_sms_rollover_percent',
        'description',
        'features',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'unused_sms_rollover_percent' => 'decimal:2',
        'features' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the subscriptions for this plan.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }
}
