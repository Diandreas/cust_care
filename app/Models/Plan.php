<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'code',
        'price',
        'annual_price',
        'annual_discount_percent',
        'billing_period',
        'max_clients',
        'max_campaigns_per_month',
        'total_campaign_sms',
        'monthly_sms_quota',
        'monthly_messages',
        'monthly_campaigns',
        'unused_sms_rollover_percent',
        'description',
        'advanced_analytics',
        'custom_templates',
        'features',
        'is_active',
        'is_featured',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'annual_price' => 'decimal:2',
        'annual_discount_percent' => 'integer',
        'features' => 'array',
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'advanced_analytics' => 'boolean',
        'custom_templates' => 'boolean',
        'unused_sms_rollover_percent' => 'decimal:2',
    ];

    /**
     * Get the subscriptions for this plan.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }
    
    /**
     * Check if the plan has an annual option
     */
    public function getHasAnnualOptionAttribute(): bool
    {
        return $this->annual_price > 0;
    }
    
    /**
     * Get the formatted price.
     */
    public function getFormattedPriceAttribute(): string
    {
        return number_format($this->price / 100, 2) . ' €';
    }
    
    /**
     * Get the annual price with 20% discount.
     */
    public function getAnnualPriceAttribute(): float
    {
        // If annual_price is set directly, use it
        if (isset($this->attributes['annual_price']) && $this->attributes['annual_price'] > 0) {
            return $this->attributes['annual_price'];
        }
        
        // Otherwise calculate based on monthly price
        return $this->price * 12 * 0.8;
    }
    
    /**
     * Get the formatted annual price.
     */
    public function getFormattedAnnualPriceAttribute(): string
    {
        return number_format($this->annual_price / 100, 2) . ' €';
    }
    
    /**
     * Get the monthly price for annual billing.
     */
    public function getMonthlyPriceForAnnualAttribute(): float
    {
        return $this->annual_price / 12;
    }
    
    /**
     * Get the formatted monthly price for annual billing.
     */
    public function getFormattedMonthlyPriceForAnnualAttribute(): string
    {
        return number_format($this->monthly_price_for_annual / 100, 2) . ' €';
    }
} 