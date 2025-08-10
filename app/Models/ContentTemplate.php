<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Tags\HasTags;

class ContentTemplate extends Model
{
    use HasFactory, HasTags;

    const TYPE_POST = 'post';
    const TYPE_ARTICLE = 'article';
    const TYPE_FLYER = 'flyer';
    const TYPE_EMAIL = 'email';
    const TYPE_SMS = 'sms';
    const TYPE_WHATSAPP = 'whatsapp';

    const CATEGORY_PROMOTIONAL = 'promotional';
    const CATEGORY_EDUCATIONAL = 'educational';
    const CATEGORY_ENTERTAINMENT = 'entertainment';
    const CATEGORY_ANNOUNCEMENT = 'announcement';
    const CATEGORY_SEASONAL = 'seasonal';

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'type',
        'category',
        'content_structure',
        'variables',
        'default_values',
        'ai_prompt',
        'is_public',
        'usage_count'
    ];

    protected $casts = [
        'content_structure' => 'array',
        'variables' => 'array',
        'default_values' => 'array',
        'is_public' => 'boolean'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function socialPosts()
    {
        return $this->hasMany(SocialPost::class, 'template_id');
    }

    public function articles()
    {
        return $this->hasMany(Article::class, 'template_id');
    }

    public function flyers()
    {
        return $this->hasMany(Flyer::class, 'template_id');
    }

    public function generateContent(array $variables = []): string
    {
        $content = $this->content_structure;
        $values = array_merge($this->default_values ?? [], $variables);

        foreach ($values as $key => $value) {
            $content = str_replace("{{$key}}", $value, $content);
        }

        return $content;
    }

    public function incrementUsage()
    {
        $this->increment('usage_count');
    }
}