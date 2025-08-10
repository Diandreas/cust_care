<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Tags\HasTags;

class Flyer extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, HasTags;

    const STATUS_DRAFT = 'draft';
    const STATUS_COMPLETED = 'completed';
    const STATUS_ARCHIVED = 'archived';

    const FORMAT_A4 = 'a4';
    const FORMAT_A5 = 'a5';
    const FORMAT_SQUARE = 'square';
    const FORMAT_STORY = 'story';
    const FORMAT_POST = 'post';

    protected $fillable = [
        'user_id',
        'template_id',
        'title',
        'design_data',
        'format',
        'status',
        'ai_generated',
        'download_count'
    ];

    protected $casts = [
        'design_data' => 'array',
        'ai_generated' => 'boolean'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function template()
    {
        return $this->belongsTo(ContentTemplate::class, 'template_id');
    }

    public function incrementDownloads()
    {
        $this->increment('download_count');
    }

    public function getDimensions(): array
    {
        return match($this->format) {
            self::FORMAT_A4 => ['width' => 210, 'height' => 297],
            self::FORMAT_A5 => ['width' => 148, 'height' => 210],
            self::FORMAT_SQUARE => ['width' => 1080, 'height' => 1080],
            self::FORMAT_STORY => ['width' => 1080, 'height' => 1920],
            self::FORMAT_POST => ['width' => 1200, 'height' => 630],
            default => ['width' => 1080, 'height' => 1080]
        };
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('design_images')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
        
        $this->addMediaCollection('exports')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'application/pdf']);
    }
}