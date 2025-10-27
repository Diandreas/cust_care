<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class ContentTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'category',
        'description',
        'content_structure',
        'variables',
        'default_values',
        'parameters',
        'is_active',
        'is_public',
        'usage_count',
        'tags'
    ];

    protected $casts = [
        'variables' => 'array',
        'default_values' => 'array', 
        'parameters' => 'array',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'usage_count' => 'integer',
        'tags' => 'array'
    ];

    /**
     * Relations
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function generatedContents()
    {
        return $this->hasMany(GeneratedContent::class, 'template_id');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopePopular($query, int $minUsage = 10)
    {
        return $query->where('usage_count', '>=', $minUsage);
    }

    public function scopeWithTag($query, string $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }

    /**
     * Accesseurs
     */
    public function getTypeDisplayAttribute(): string
    {
        $types = [
            'social_post' => 'Post Réseaux Sociaux',
            'email' => 'Email Marketing',
            'sms' => 'Message SMS',
            'article' => 'Article de Blog',
            'newsletter' => 'Newsletter',
            'promotion' => 'Message Promotionnel',
            'birthday' => 'Message Anniversaire',
            'follow_up' => 'Message de Suivi',
            'welcome' => 'Message de Bienvenue',
            'seasonal' => 'Message Saisonnier'
        ];

        return $types[$this->type] ?? ucfirst($this->type);
    }

    public function getCategoryDisplayAttribute(): string
    {
        $categories = [
            'marketing' => 'Marketing',
            'customer_service' => 'Service Client',
            'sales' => 'Ventes',
            'events' => 'Événements',
            'seasonal' => 'Saisonnier',
            'general' => 'Général'
        ];

        return $categories[$this->category] ?? ucfirst($this->category);
    }

    public function getVariableListAttribute(): string
    {
        if (empty($this->variables)) {
            return 'Aucune variable';
        }

        return '{' . implode('}, {', $this->variables) . '}';
    }

    public function getPreviewAttribute(): string
    {
        $content = $this->content_structure;
        
        if ($this->default_values) {
            foreach ($this->default_values as $variable => $value) {
                $content = str_replace('{' . $variable . '}', $value, $content);
            }
        }

        return Str::limit($content, 150);
    }

    /**
     * Méthodes utiles
     */
    public function generateContent(array $variables = []): string
    {
        $content = $this->content_structure;
        
        // Fusionner avec les valeurs par défaut
        $allVariables = array_merge($this->default_values ?? [], $variables);
        
        // Remplacer les variables dans le contenu
        foreach ($allVariables as $key => $value) {
            $content = str_replace('{' . $key . '}', $value, $content);
        }
        
        // Incrémenter le compteur d'usage
        $this->increment('usage_count');
        
        return $content;
    }

    public function getRequiredVariables(): array
    {
        return array_diff($this->variables ?? [], array_keys($this->default_values ?? []));
    }

    public function hasAllRequiredVariables(array $providedVariables): bool
    {
        $required = $this->getRequiredVariables();
        return empty(array_diff($required, array_keys($providedVariables)));
    }

    public function validateVariables(array $variables): array
    {
        $errors = [];
        $required = $this->getRequiredVariables();
        
        foreach ($required as $variable) {
            if (!isset($variables[$variable]) || empty($variables[$variable])) {
                $errors[] = "La variable '{$variable}' est requise";
            }
        }
        
        return $errors;
    }

    public function duplicate(string $newName = null): self
    {
        $duplicate = $this->replicate();
        $duplicate->name = $newName ?? $this->name . ' (Copie)';
        $duplicate->usage_count = 0;
        $duplicate->is_public = false;
        $duplicate->save();
        
        return $duplicate;
    }

    public function activate(): void
    {
        $this->update(['is_active' => true]);
    }

    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    public function makePublic(): void
    {
        $this->update(['is_public' => true]);
    }

    public function makePrivate(): void
    {
        $this->update(['is_public' => false]);
    }

    public function addTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        if (!in_array($tag, $tags)) {
            $tags[] = $tag;
            $this->update(['tags' => $tags]);
        }
    }

    public function removeTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        $tags = array_filter($tags, fn($t) => $t !== $tag);
        $this->update(['tags' => array_values($tags)]);
    }

    public function getPerformanceScore(): int
    {
        $score = 0;
        
        // Usage populaire
        if ($this->usage_count >= 50) {
            $score += 40;
        } elseif ($this->usage_count >= 20) {
            $score += 30;
        } elseif ($this->usage_count >= 5) {
            $score += 20;
        }
        
        // Template bien documenté
        if ($this->description && strlen($this->description) > 20) {
            $score += 20;
        }
        
        // Variables bien définies
        if (!empty($this->variables) && !empty($this->default_values)) {
            $score += 20;
        }
        
        // Template récent ou utilisé récemment
        if ($this->updated_at >= now()->subMonth()) {
            $score += 20;
        }
        
        return min($score, 100);
    }

    /**
     * Statistiques statiques
     */
    public static function getPopularTemplates(int $limit = 10, int $userId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = self::query()->active();
        
        if ($userId) {
            $query->where('user_id', $userId);
        }
        
        return $query->orderByDesc('usage_count')
            ->limit($limit)
            ->get();
    }

    public static function getTemplatesByCategory(int $userId = null): array
    {
        $query = self::query()->active();
        
        if ($userId) {
            $query->where('user_id', $userId);
        }
        
        return $query->selectRaw('category, COUNT(*) as count, AVG(usage_count) as avg_usage')
            ->groupBy('category')
            ->get()
            ->keyBy('category')
            ->toArray();
    }

    public static function getRecentlyUsed(int $limit = 5, int $userId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = self::query()->active();
        
        if ($userId) {
            $query->where('user_id', $userId);
        }
        
        return $query->where('usage_count', '>', 0)
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get();
    }

    public static function searchTemplates(string $searchTerm, int $userId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = self::query()->active();
        
        if ($userId) {
            $query->where('user_id', $userId);
        }
        
        return $query->where(function ($q) use ($searchTerm) {
            $q->where('name', 'like', "%{$searchTerm}%")
              ->orWhere('description', 'like', "%{$searchTerm}%")
              ->orWhere('content_structure', 'like', "%{$searchTerm}%")
              ->orWhereJsonContains('tags', $searchTerm);
        })->get();
    }
}