<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MarketingFlyer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'format',
        'orientation',
        'design_data',
        'content_data',
        'ai_generated_content',
        'template_name',
        'export_settings',
        'status',
    ];

    protected $casts = [
        'design_data' => 'array',
        'content_data' => 'array',
        'ai_generated_content' => 'array',
        'export_settings' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    public function publish(): void
    {
        $this->update(['status' => 'published']);
    }

    public function archive(): void
    {
        $this->update(['status' => 'archived']);
    }

    public function getFormatDimensions(): array
    {
        $dimensions = [
            'a4' => ['width' => 210, 'height' => 297],
            'a5' => ['width' => 148, 'height' => 210],
            'square' => ['width' => 1080, 'height' => 1080],
            'story' => ['width' => 1080, 'height' => 1920],
            'post' => ['width' => 1200, 'height' => 630],
        ];

        $format = $this->format;
        $baseDimensions = $dimensions[$format] ?? $dimensions['a4'];

        if ($this->orientation === 'landscape' && in_array($format, ['a4', 'a5'])) {
            return [
                'width' => $baseDimensions['height'],
                'height' => $baseDimensions['width']
            ];
        }

        return $baseDimensions;
    }

    public function getDesignData(): array
    {
        return $this->design_data ?? [];
    }

    public function getContentData(): array
    {
        return $this->content_data ?? [];
    }

    public function getAIGeneratedContent(): array
    {
        return $this->ai_generated_content ?? [];
    }

    public function updateDesignData(array $data): void
    {
        $this->update(['design_data' => $data]);
    }

    public function updateContentData(array $data): void
    {
        $this->update(['content_data' => $data]);
    }

    public function updateAIGeneratedContent(array $data): void
    {
        $this->update(['ai_generated_content' => $data]);
    }

    public function getExportSettings(): array
    {
        return $this->export_settings ?? [
            'format' => 'png',
            'quality' => 'high',
            'resolution' => 300,
        ];
    }

    public function setExportSettings(array $settings): void
    {
        $this->update(['export_settings' => $settings]);
    }

    public function getTemplateName(): ?string
    {
        return $this->template_name;
    }

    public function setTemplateName(string $name): void
    {
        $this->update(['template_name' => $name]);
    }

    public function getFormatOptions(): array
    {
        return [
            'a4' => 'A4 (210 x 297 mm)',
            'a5' => 'A5 (148 x 210 mm)',
            'square' => 'Carré (1080 x 1080 px)',
            'story' => 'Story (1080 x 1920 px)',
            'post' => 'Post (1200 x 630 px)',
        ];
    }

    public function getOrientationOptions(): array
    {
        return [
            'portrait' => 'Portrait',
            'landscape' => 'Paysage',
        ];
    }

    public function getStatusOptions(): array
    {
        return [
            'draft' => 'Brouillon',
            'published' => 'Publié',
            'archived' => 'Archivé',
        ];
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeOfFormat($query, string $format)
    {
        return $query->where('format', $format);
    }

    public function scopeWithTemplate($query, string $templateName)
    {
        return $query->where('template_name', $templateName);
    }

    public function duplicate(): self
    {
        $newFlyer = $this->replicate();
        $newFlyer->name = $this->name . ' (Copie)';
        $newFlyer->status = 'draft';
        $newFlyer->save();
        
        return $newFlyer;
    }

    public function export(string $format = 'png'): string
    {
        // Logique d'export selon le format
        $exportSettings = $this->getExportSettings();
        $exportSettings['format'] = $format;
        
        // Ici, vous implémenteriez la logique d'export réelle
        // Utilisant des bibliothèques comme Intervention Image ou Canvas API
        
        $filename = "flyer_{$this->id}_{$format}_" . time() . ".{$format}";
        
        // Simuler l'export
        return $filename;
    }

    public function getPreviewUrl(): string
    {
        // URL de prévisualisation du flyer
        return route('marketing.flyers.preview', $this->id);
    }

    public function getDownloadUrl(string $format = 'png'): string
    {
        // URL de téléchargement du flyer
        return route('marketing.flyers.download', ['flyer' => $this->id, 'format' => $format]);
    }

    public function getThumbnailUrl(): string
    {
        // URL de la miniature du flyer
        return route('marketing.flyers.thumbnail', $this->id);
    }

    public function hasAIContent(): bool
    {
        return !empty($this->ai_generated_content);
    }

    public function getAIContentSummary(): string
    {
        if (!$this->hasAIContent()) {
            return 'Aucun contenu IA généré';
        }

        $content = $this->getAIGeneratedContent();
        $summary = [];

        if (isset($content['title'])) {
            $summary[] = "Titre: {$content['title']}";
        }

        if (isset($content['description'])) {
            $summary[] = "Description: {$content['description']}";
        }

        if (isset($content['keywords'])) {
            $summary[] = "Mots-clés: " . implode(', ', $content['keywords']);
        }

        return implode(' | ', $summary);
    }

    public function getContentSummary(): string
    {
        $content = $this->getContentData();
        $summary = [];

        if (isset($content['headline'])) {
            $summary[] = "Titre: {$content['headline']}";
        }

        if (isset($content['subheadline'])) {
            $summary[] = "Sous-titre: {$content['subheadline']}";
        }

        if (isset($content['body_text'])) {
            $summary[] = "Texte: " . substr($content['body_text'], 0, 100) . "...";
        }

        return implode(' | ', $summary);
    }
}