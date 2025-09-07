<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class GeneratedContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'platform',
        'topic',
        'content',
        'parameters',
        'prompt_used',
        'is_used',
        'character_count',
        'word_count'
    ];

    protected $casts = [
        'parameters' => 'array',
        'is_used' => 'boolean'
    ];

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
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByPlatform($query, string $platform)
    {
        return $query->where('platform', $platform);
    }

    public function scopeUnused($query)
    {
        return $query->where('is_used', false);
    }

    public function scopeUsed($query)
    {
        return $query->where('is_used', true);
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Accesseurs
     */
    public function getTypeDisplayAttribute(): string
    {
        $types = [
            'social_post' => 'Post Réseaux Sociaux',
            'article' => 'Article de Blog',
            'message' => 'Message Personnalisé',
            'flyer_content' => 'Contenu de Flyer',
            'email' => 'Email Marketing'
        ];

        return $types[$this->type] ?? ucfirst($this->type);
    }

    public function getPlatformDisplayAttribute(): ?string
    {
        if (!$this->platform) {
            return null;
        }

        $platforms = [
            'facebook' => 'Facebook',
            'instagram' => 'Instagram',
            'linkedin' => 'LinkedIn',
            'twitter' => 'Twitter/X',
            'tiktok' => 'TikTok',
            'youtube' => 'YouTube'
        ];

        return $platforms[$this->platform] ?? ucfirst($this->platform);
    }

    public function getReadingTimeAttribute(): string
    {
        $minutes = ceil($this->word_count / 200); // 200 mots par minute
        return $minutes === 1 ? '1 minute' : "$minutes minutes";
    }

    public function getContentPreviewAttribute(): string
    {
        return Str::limit($this->content, 100);
    }

    public function getHashtagsAttribute(): array
    {
        preg_match_all('/#[\w\u00C0-\u017F]+/', $this->content, $matches);
        return $matches[0] ?? [];
    }

    /**
     * Méthodes utiles
     */
    public function markAsUsed(): void
    {
        $this->update(['is_used' => true]);
    }

    public function markAsUnused(): void
    {
        $this->update(['is_used' => false]);
    }

    public function duplicate(): self
    {
        $duplicate = $this->replicate();
        $duplicate->topic = $this->topic . ' (Copie)';
        $duplicate->is_used = false;
        $duplicate->save();

        return $duplicate;
    }

    public function updateContent(string $newContent): void
    {
        $this->update([
            'content' => $newContent,
            'character_count' => strlen($newContent),
            'word_count' => str_word_count($newContent)
        ]);
    }

    public function getQualityScore(): int
    {
        $score = 0;

        // Longueur appropriée
        if ($this->type === 'social_post') {
            if ($this->character_count >= 50 && $this->character_count <= 300) {
                $score += 30;
            }
        } elseif ($this->type === 'article') {
            if ($this->word_count >= 300 && $this->word_count <= 2000) {
                $score += 30;
            }
        }

        // Présence de hashtags pour les posts sociaux
        if ($this->type === 'social_post' && count($this->hashtags) > 0) {
            $score += 20;
        }

        // Contenu original (non dupliqué)
        if (!$this->is_used) {
            $score += 20;
        }

        // Récence du contenu
        if ($this->created_at >= now()->subDays(7)) {
            $score += 15;
        }

        // Présence de paramètres détaillés
        if (is_array($this->parameters) && count($this->parameters) >= 3) {
            $score += 15;
        }

        return min($score, 100);
    }

    /**
     * Statistiques statiques
     */
    public static function getTypeStats(int $userId = null): array
    {
        $query = self::query();
        
        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->selectRaw('type, COUNT(*) as count, AVG(word_count) as avg_words')
            ->groupBy('type')
            ->get()
            ->keyBy('type')
            ->toArray();
    }

    public static function getPlatformStats(int $userId = null): array
    {
        $query = self::query();
        
        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->whereNotNull('platform')
            ->selectRaw('platform, COUNT(*) as count')
            ->groupBy('platform')
            ->get()
            ->keyBy('platform')
            ->toArray();
    }

    public static function getUsageStats(int $userId = null): array
    {
        $query = self::query();
        
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $total = $query->count();
        $used = $query->where('is_used', true)->count();
        
        return [
            'total' => $total,
            'used' => $used,
            'unused' => $total - $used,
            'usage_rate' => $total > 0 ? round(($used / $total) * 100, 1) : 0
        ];
    }
}
