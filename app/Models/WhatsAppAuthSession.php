<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Carbon\Carbon;

class WhatsAppAuthSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'phone_number',
        'pin_code',
        'user_id',
        'is_verified',
        'verified_at',
        'expires_at',
        'session_token',
        'session_data',
        'attempts',
        'is_blocked',
        'blocked_until'
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
        'expires_at' => 'datetime',
        'session_data' => 'array',
        'is_blocked' => 'boolean',
        'blocked_until' => 'datetime'
    ];

    protected $hidden = [
        'pin_code',
        'session_token'
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
    public function scopeActive($query)
    {
        return $query->where('is_verified', true)
            ->where('expires_at', '>', now())
            ->where('is_blocked', false);
    }

    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    public function scopeBlocked($query)
    {
        return $query->where('is_blocked', true)
            ->where('blocked_until', '>', now());
    }

    public function scopeByPhone($query, string $phoneNumber)
    {
        return $query->where('phone_number', $phoneNumber);
    }

    public function scopePending($query)
    {
        return $query->where('is_verified', false)
            ->where('expires_at', '>', now())
            ->where('is_blocked', false);
    }

    /**
     * Accesseurs
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->is_verified && 
               $this->expires_at > now() && 
               !$this->is_blocked;
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at <= now();
    }

    public function getTimeRemainingAttribute(): ?string
    {
        if ($this->is_expired) {
            return null;
        }

        $diff = now()->diffInMinutes($this->expires_at);
        
        if ($diff < 60) {
            return $diff . ' minute(s)';
        }
        
        return round($diff / 60, 1) . ' heure(s)';
    }

    public function getStatusDisplayAttribute(): string
    {
        if ($this->is_blocked) {
            return 'Bloqué';
        }
        
        if ($this->is_expired) {
            return 'Expiré';
        }
        
        if (!$this->is_verified) {
            return 'En attente de vérification';
        }
        
        return 'Actif';
    }

    public function getFormattedPhoneAttribute(): string
    {
        // Formatage basique du numéro de téléphone
        $phone = $this->phone_number;
        
        if (strpos($phone, '+33') === 0) {
            // Numéro français
            return '+33 ' . substr($phone, 3, 1) . ' ' . 
                   chunk_split(substr($phone, 4), 2, ' ');
        }
        
        return $phone;
    }

    /**
     * Mutateurs
     */
    public function setPhoneNumberAttribute($value)
    {
        // Nettoyer et normaliser le numéro de téléphone
        $cleaned = preg_replace('/[^0-9+]/', '', $value);
        
        if (strpos($cleaned, '+') !== 0) {
            $cleaned = '+' . ltrim($cleaned, '0');
        }
        
        $this->attributes['phone_number'] = $cleaned;
    }

    /**
     * Méthodes utiles
     */
    public function verify(int $userId = null): bool
    {
        if ($this->is_expired || $this->is_blocked) {
            return false;
        }

        $this->update([
            'is_verified' => true,
            'verified_at' => now(),
            'user_id' => $userId,
            'session_token' => \Illuminate\Support\Str::random(64),
            'expires_at' => now()->addHours(24) // Session valide 24h
        ]);

        return true;
    }

    public function block(int $minutes = 30): void
    {
        $this->update([
            'is_blocked' => true,
            'blocked_until' => now()->addMinutes($minutes)
        ]);
    }

    public function unblock(): void
    {
        $this->update([
            'is_blocked' => false,
            'blocked_until' => null
        ]);
    }

    public function extend(int $hours = 24): void
    {
        if ($this->is_active) {
            $this->update([
                'expires_at' => now()->addHours($hours)
            ]);
        }
    }

    public function revoke(): void
    {
        $this->update([
            'is_verified' => false,
            'session_token' => null,
            'expires_at' => now()
        ]);
    }

    public function incrementAttempts(): void
    {
        $this->increment('attempts');
        
        // Auto-bloquer après 3 tentatives
        if ($this->attempts >= 3) {
            $this->block(30);
        }
    }

    public function resetAttempts(): void
    {
        $this->update(['attempts' => 0]);
    }

    /**
     * Méthodes statiques
     */
    public static function generatePin(): string
    {
        return str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
    }

    public static function cleanupExpired(): int
    {
        // Supprimer les sessions expirées depuis plus de 7 jours
        return self::where('expires_at', '<', now()->subDays(7))->delete();
    }

    public static function getActiveSessionsCount(): int
    {
        return self::active()->count();
    }

    public static function findByToken(string $token): ?self
    {
        return self::where('session_token', $token)
            ->active()
            ->first();
    }

    public static function findActiveByPhone(string $phoneNumber): ?self
    {
        return self::byPhone($phoneNumber)
            ->active()
            ->first();
    }

    public static function createForPhone(string $phoneNumber): self
    {
        // Nettoyer les anciennes sessions pour ce numéro
        self::byPhone($phoneNumber)->delete();

        return self::create([
            'phone_number' => $phoneNumber,
            'pin_code' => self::generatePin(),
            'expires_at' => now()->addMinutes(10) // PIN valide 10 minutes
        ]);
    }

    /**
     * Boot method
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-cleanup des sessions expirées
        static::created(function () {
            if (random_int(1, 100) <= 5) { // 5% de chance
                self::cleanupExpired();
            }
        });
    }
}
