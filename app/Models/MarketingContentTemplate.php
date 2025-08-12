<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingContentTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'type',
        'content_structure',
        'variables',
        'default_values',
        'platforms',
        'tone',
        'ai_settings',
        'is_active',
    ];

    protected $casts = [
        'variables' => 'array',
        'default_values' => 'array',
        'platforms' => 'array',
        'ai_settings' => 'array',
        'is_active' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->is_active;
    }

    public function activate(): void
    {
        $this->update(['is_active' => true]);
    }

    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }

    public function getVariables(): array
    {
        return $this->variables ?? [];
    }

    public function getDefaultValues(): array
    {
        return $this->default_values ?? [];
    }

    public function getPlatforms(): array
    {
        return $this->platforms ?? [];
    }

    public function supportsPlatform(string $platform): bool
    {
        return in_array($platform, $this->getPlatforms());
    }

    public function generateContent(array $variables = []): string
    {
        $content = $this->content_structure;
        $defaults = $this->getDefaultValues();
        
        // Fusionner les valeurs par défaut avec les variables fournies
        $finalVariables = array_merge($defaults, $variables);
        
        // Remplacer les variables dans le contenu
        foreach ($finalVariables as $key => $value) {
            $content = str_replace('{' . $key . '}', $value, $content);
        }
        
        return $content;
    }

    public function validateVariables(array $variables): array
    {
        $requiredVariables = $this->getVariables();
        $errors = [];
        
        foreach ($requiredVariables as $variable) {
            if (!isset($variables[$variable]) || empty($variables[$variable])) {
                $errors[] = "La variable '{$variable}' est requise.";
            }
        }
        
        return $errors;
    }

    public function getAISettings(): array
    {
        return $this->ai_settings ?? [];
    }

    public function isAIGenerated(): bool
    {
        return !empty($this->ai_settings);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeForPlatform($query, string $platform)
    {
        return $query->whereJsonContains('platforms', $platform);
    }

    public function scopeWithTone($query, string $tone)
    {
        return $query->where('tone', $tone);
    }

    public function scopeWithAI($query)
    {
        return $query->whereNotNull('ai_settings');
    }

    public function getToneOptions(): array
    {
        return [
            'professional' => 'Professionnel',
            'casual' => 'Décontracté',
            'friendly' => 'Amical',
            'formal' => 'Formel',
            'creative' => 'Créatif',
        ];
    }

    public function getTypeOptions(): array
    {
        return [
            'post' => 'Post Réseaux Sociaux',
            'article' => 'Article de Blog',
            'message' => 'Message WhatsApp/Email',
            'flyer' => 'Flyer',
            'email' => 'Email Marketing',
        ];
    }

    public function getPlatformOptions(): array
    {
        return [
            'facebook' => 'Facebook',
            'instagram' => 'Instagram',
            'twitter' => 'Twitter/X',
            'linkedin' => 'LinkedIn',
            'whatsapp' => 'WhatsApp',
            'email' => 'Email',
            'flyer' => 'Flyer',
        ];
    }

    public function duplicate(): self
    {
        $newTemplate = $this->replicate();
        $newTemplate->name = $this->name . ' (Copie)';
        $newTemplate->is_active = false;
        $newTemplate->save();
        
        return $newTemplate;
    }

    public function getUsageCount(): int
    {
        // Compter combien de fois ce template a été utilisé
        // À implémenter selon vos besoins
        return 0;
    }

    public function getLastUsedAt()
    {
        // Dernière utilisation du template
        // À implémenter selon vos besoins
        return null;
    }
}