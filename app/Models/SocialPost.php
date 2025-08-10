<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Tags\HasTags;

class SocialPost extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, HasTags;

    const STATUS_DRAFT = 'draft';
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_PUBLISHED = 'published';
    const STATUS_FAILED = 'failed';

    const PLATFORM_FACEBOOK = 'facebook';
    const PLATFORM_INSTAGRAM = 'instagram';
    const PLATFORM_TWITTER = 'twitter';
    const PLATFORM_LINKEDIN = 'linkedin';
    const PLATFORM_WHATSAPP = 'whatsapp';

    protected $fillable = [
        'user_id',
        'title',
        'content',
        'platforms',
        'scheduled_at',
        'published_at',
        'status',
        'ai_generated',
        'template_id',
        'engagement_metrics',
        'error_message'
    ];

    protected $casts = [
        'platforms' => 'array',
        'scheduled_at' => 'datetime',
        'published_at' => 'datetime',
        'ai_generated' => 'boolean',
        'engagement_metrics' => 'array'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function template()
    {
        return $this->belongsTo(ContentTemplate::class, 'template_id');
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_FAILED]);
    }

    public function canBeScheduled(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function scopeScheduledForNow($query)
    {
        return $query->where('status', self::STATUS_SCHEDULED)
            ->where('scheduled_at', '<=', now());
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
        
        $this->addMediaCollection('videos')
            ->acceptsMimeTypes(['video/mp4', 'video/avi', 'video/mov']);
    }
}