<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_id',
        'campaign_id',
        'type',
        'content',
        'metadata',
        'status',
        'sent_at',
        'delivered_at',
        'read_at',
        'error_details',
        'ai_generated',
    ];

    protected $casts = [
        'metadata' => 'array',
        'error_details' => 'array',
        'ai_generated' => 'array',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(MarketingClient::class, 'client_id');
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(MarketingCampaign::class, 'campaign_id');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isSent(): bool
    {
        return $this->status === 'sent';
    }

    public function isDelivered(): bool
    {
        return $this->status === 'delivered';
    }

    public function isRead(): bool
    {
        return $this->status === 'read';
    }

    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    public function markAsSent(): void
    {
        $this->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    public function markAsDelivered(): void
    {
        $this->update([
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);
    }

    public function markAsRead(): void
    {
        $this->update([
            'status' => 'read',
            'read_at' => now(),
        ]);
    }

    public function markAsFailed(string $error = null): void
    {
        $this->update([
            'status' => 'failed',
            'error_details' => array_merge($this->error_details ?? [], [
                'error' => $error,
                'failed_at' => now()->toISOString(),
            ]),
        ]);
    }

    public function getMetadata(): array
    {
        return $this->metadata ?? [];
    }

    public function setMetadata(array $metadata): void
    {
        $this->update(['metadata' => $metadata]);
    }

    public function addMetadata(string $key, $value): void
    {
        $metadata = $this->getMetadata();
        $metadata[$key] = $value;
        $this->setMetadata($metadata);
    }

    public function getErrorDetails(): array
    {
        return $this->error_details ?? [];
    }

    public function hasErrors(): bool
    {
        return !empty($this->error_details);
    }

    public function getLastError(): ?string
    {
        if (!$this->hasErrors()) {
            return null;
        }

        $errors = $this->getErrorDetails();
        return end($errors)['error'] ?? null;
    }

    public function isAIGenerated(): bool
    {
        return !empty($this->ai_generated);
    }

    public function getAIGeneratedData(): array
    {
        return $this->ai_generated ?? [];
    }

    public function setAIGeneratedData(array $data): void
    {
        $this->update(['ai_generated' => $data]);
    }

    public function getDeliveryTime(): ?int
    {
        if (!$this->sent_at || !$this->delivered_at) {
            return null;
        }

        return $this->sent_at->diffInSeconds($this->delivered_at);
    }

    public function getReadTime(): ?int
    {
        if (!$this->delivered_at || !$this->read_at) {
            return null;
        }

        return $this->delivered_at->diffInSeconds($this->read_at);
    }

    public function getTotalTime(): ?int
    {
        if (!$this->sent_at || !$this->read_at) {
            return null;
        }

        return $this->sent_at->diffInSeconds($this->read_at);
    }

    public function getTypeLabel(): string
    {
        $types = [
            'whatsapp' => 'WhatsApp',
            'email' => 'Email',
            'notification' => 'Notification',
        ];

        return $types[$this->type] ?? $this->type;
    }

    public function getStatusLabel(): string
    {
        $statuses = [
            'pending' => 'En attente',
            'sent' => 'Envoyé',
            'delivered' => 'Livré',
            'read' => 'Lu',
            'failed' => 'Échec',
        ];

        return $statuses[$this->status] ?? $this->status;
    }

    public function getStatusColor(): string
    {
        $colors = [
            'pending' => 'yellow',
            'sent' => 'blue',
            'delivered' => 'green',
            'read' => 'green',
            'failed' => 'red',
        ];

        return $colors[$this->status] ?? 'gray';
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeSent($query)
    {
        return $query->where('status', '!=', 'pending');
    }

    public function scopeDelivered($query)
    {
        return $query->whereIn('status', ['delivered', 'read']);
    }

    public function scopeRead($query)
    {
        return $query->where('status', 'read');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeForCampaign($query, int $campaignId)
    {
        return $query->where('campaign_id', $campaignId);
    }

    public function scopeForClient($query, int $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeAIGenerated($query)
    {
        return $query->whereNotNull('ai_generated');
    }

    public function scopeSentToday($query)
    {
        return $query->whereDate('sent_at', today());
    }

    public function scopeSentThisWeek($query)
    {
        return $query->whereBetween('sent_at', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    public function scopeSentThisMonth($query)
    {
        return $query->whereMonth('sent_at', now()->month)
                    ->whereYear('sent_at', now()->year);
    }

    public function getDeliveryRate(): float
    {
        if (!$this->sent_at) {
            return 0;
        }

        if ($this->isDelivered() || $this->isRead()) {
            return 100;
        }

        return 0;
    }

    public function canRetry(): bool
    {
        return $this->isFailed() && 
               (!$this->metadata['retry_count'] || $this->metadata['retry_count'] < 3);
    }

    public function incrementRetryCount(): void
    {
        $retryCount = ($this->metadata['retry_count'] ?? 0) + 1;
        $this->addMetadata('retry_count', $retryCount);
    }

    public function getRetryCount(): int
    {
        return $this->metadata['retry_count'] ?? 0;
    }
}