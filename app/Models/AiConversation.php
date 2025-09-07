<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class AiConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_id',
        'platform',
        'session_id',
        'messages',
        'status',
        'context',
        'last_activity_at'
    ];

    protected $casts = [
        'messages' => 'array',
        'context' => 'array',
        'last_activity_at' => 'datetime'
    ];

    /**
     * Relations
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByPlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }

    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('last_activity_at', '>=', now()->subHours($hours));
    }

    /**
     * Accesseurs
     */
    public function getMessageCountAttribute(): int
    {
        return count($this->messages ?? []);
    }

    public function getLastMessageAttribute(): ?array
    {
        $messages = $this->messages ?? [];
        return end($messages) ?: null;
    }

    public function getDurationAttribute(): ?string
    {
        if (!$this->created_at || !$this->last_activity_at) {
            return null;
        }

        $duration = $this->created_at->diffInMinutes($this->last_activity_at);
        
        if ($duration < 60) {
            return $duration . ' min';
        }
        
        return round($duration / 60, 1) . ' h';
    }

    /**
     * Méthodes utiles
     */
    public function addMessage(string $role, string $content, array $metadata = []): void
    {
        $messages = $this->messages ?? [];
        
        $messages[] = [
            'role' => $role, // 'user' ou 'assistant'
            'content' => $content,
            'timestamp' => now()->toISOString(),
            'metadata' => $metadata
        ];

        $this->update([
            'messages' => $messages,
            'last_activity_at' => now()
        ]);
    }

    public function markAsEnded(): void
    {
        $this->update(['status' => 'ended']);
    }

    public function archive(): void
    {
        $this->update(['status' => 'archived']);
    }

    public function getTotalTokensUsed(): int
    {
        $total = 0;
        foreach ($this->messages ?? [] as $message) {
            if (isset($message['metadata']['tokens'])) {
                $total += $message['metadata']['tokens'];
            }
        }
        return $total;
    }

    public function getConversationSummary(): string
    {
        $messages = $this->messages ?? [];
        if (empty($messages)) {
            return 'Conversation vide';
        }

        $firstMessage = reset($messages);
        $messageCount = count($messages);
        
        return "Conversation de {$messageCount} messages commencée par: " . 
               Str::limit($firstMessage['content'] ?? '', 50);
    }
}
