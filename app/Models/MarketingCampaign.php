<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class MarketingCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'type',
        'status',
        'target_audience',
        'content',
        'scheduled_at',
        'started_at',
        'completed_at',
        'settings',
        'metrics',
    ];

    protected $casts = [
        'target_audience' => 'array',
        'content' => 'array',
        'settings' => 'array',
        'metrics' => 'array',
        'scheduled_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(MarketingMessage::class, 'campaign_id');
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isScheduled(): bool
    {
        return $this->status === 'scheduled';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isPaused(): bool
    {
        return $this->status === 'paused';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function canStart(): bool
    {
        return in_array($this->status, ['draft', 'scheduled']) && 
               (!$this->scheduled_at || $this->scheduled_at->isPast());
    }

    public function start(): void
    {
        if ($this->canStart()) {
            $this->update([
                'status' => 'active',
                'started_at' => now(),
            ]);
        }
    }

    public function pause(): void
    {
        if ($this->isActive()) {
            $this->update(['status' => 'paused']);
        }
    }

    public function resume(): void
    {
        if ($this->isPaused()) {
            $this->update(['status' => 'active']);
        }
    }

    public function complete(): void
    {
        if (in_array($this->status, ['active', 'paused'])) {
            $this->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        }
    }

    public function cancel(): void
    {
        if (!in_array($this->status, ['completed', 'cancelled'])) {
            $this->update(['status' => 'cancelled']);
        }
    }

    public function schedule(Carbon $date): void
    {
        $this->update([
            'status' => 'scheduled',
            'scheduled_at' => $date,
        ]);
    }

    public function getTargetAudienceCount(): int
    {
        if (!$this->target_audience) {
            return 0;
        }

        // Logique pour compter le nombre de clients ciblés
        $query = MarketingClient::where('user_id', $this->user_id)->active();
        
        if (isset($this->target_audience['tags'])) {
            $query->withTags($this->target_audience['tags']);
        }
        
        if (isset($this->target_audience['age_range'])) {
            // Logique pour filtrer par âge
        }
        
        return $query->count();
    }

    public function getSentCount(): int
    {
        return $this->messages()->where('status', '!=', 'pending')->count();
    }

    public function getDeliveredCount(): int
    {
        return $this->messages()->whereIn('status', ['delivered', 'read'])->count();
    }

    public function getReadCount(): int
    {
        return $this->messages()->where('status', 'read')->count();
    }

    public function getDeliveryRate(): float
    {
        $sent = $this->getSentCount();
        if ($sent === 0) return 0;
        
        return round(($this->getDeliveredCount() / $sent) * 100, 2);
    }

    public function getReadRate(): float
    {
        $delivered = $this->getDeliveredCount();
        if ($delivered === 0) return 0;
        
        return round(($this->getReadCount() / $delivered) * 100, 2);
    }

    public function updateMetrics(): void
    {
        $this->update([
            'metrics' => [
                'target_count' => $this->getTargetAudienceCount(),
                'sent_count' => $this->getSentCount(),
                'delivered_count' => $this->getDeliveredCount(),
                'read_count' => $this->getReadCount(),
                'delivery_rate' => $this->getDeliveryRate(),
                'read_rate' => $this->getReadRate(),
                'last_updated' => now()->toISOString(),
            ]
        ]);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeScheduledForToday($query)
    {
        return $query->where('status', 'scheduled')
                    ->whereDate('scheduled_at', today());
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'scheduled')
                    ->where('scheduled_at', '<', now());
    }
}