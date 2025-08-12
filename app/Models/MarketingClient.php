<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class MarketingClient extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'birthday',
        'preferences',
        'status',
        'last_contact_at',
        'opted_out_at',
        'tags',
        'custom_fields',
    ];

    protected $casts = [
        'birthday' => 'date',
        'preferences' => 'array',
        'tags' => 'array',
        'custom_fields' => 'array',
        'last_contact_at' => 'datetime',
        'opted_out_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(MarketingMessage::class, 'client_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isOptedOut(): bool
    {
        return $this->status === 'opted_out';
    }

    public function hasBirthdayToday(): bool
    {
        if (!$this->birthday) {
            return false;
        }
        
        return $this->birthday->format('m-d') === now()->format('m-d');
    }

    public function hasBirthdayInDays(int $days): bool
    {
        if (!$this->birthday) {
            return false;
        }
        
        $nextBirthday = $this->birthday->copy()->year(now()->year);
        if ($nextBirthday->isPast()) {
            $nextBirthday->addYear();
        }
        
        return $nextBirthday->diffInDays(now()) === $days;
    }

    public function getDaysUntilBirthday(): int
    {
        if (!$this->birthday) {
            return 999;
        }
        
        $nextBirthday = $this->birthday->copy()->year(now()->year);
        if ($nextBirthday->isPast()) {
            $nextBirthday->addYear();
        }
        
        return $nextBirthday->diffInDays(now());
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    public function scopeOptedOut($query)
    {
        return $query->where('status', 'opted_out');
    }

    public function scopeWithBirthdayInDays($query, int $days)
    {
        return $query->whereRaw("DATE_FORMAT(birthday, '%m-%d') = ?", [
            now()->addDays($days)->format('m-d')
        ]);
    }

    public function scopeWithTags($query, array $tags)
    {
        return $query->whereJsonContains('tags', $tags);
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

    public function optOut(): void
    {
        $this->update([
            'status' => 'opted_out',
            'opted_out_at' => now(),
        ]);
    }

    public function optIn(): void
    {
        $this->update([
            'status' => 'active',
            'opted_out_at' => null,
        ]);
    }

    public function updateLastContact(): void
    {
        $this->update(['last_contact_at' => now()]);
    }

    public function isInactive(int $daysThreshold = 30): bool
    {
        if (!$this->last_contact_at) {
            return true;
        }
        
        return $this->last_contact_at->diffInDays(now()) > $daysThreshold;
    }
}