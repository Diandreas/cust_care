<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    use HasFactory;

    // Définition des statuts de campagne possibles
    const STATUS_DRAFT = 'draft';
    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_SENDING = 'sending';
    const STATUS_SENT = 'sent';
    const STATUS_PARTIALLY_SENT = 'partially_sent';
    const STATUS_PAUSED = 'paused';
    const STATUS_FAILED = 'failed';
    const STATUS_CANCELLED = 'cancelled';
    
    // Liste des statuts pour validation
    public static $statuses = [
        self::STATUS_DRAFT,
        self::STATUS_SCHEDULED,
        self::STATUS_SENDING,
        self::STATUS_SENT,
        self::STATUS_PARTIALLY_SENT,
        self::STATUS_PAUSED,
        self::STATUS_FAILED,
        self::STATUS_CANCELLED,
    ];

    protected $fillable = [
        'user_id',
        'name',
        'message_content',
        'scheduled_at',
        'status',
        'recipients_count',
        'delivered_count',
        'failed_count',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function recipients()
    {
        return $this->belongsToMany(Client::class, 'campaign_client')->withTimestamps();
    }
    
    /**
     * Vérifie si la campagne peut être modifiée
     */
    public function canBeEdited(): bool
    {
        return !in_array($this->status, [
            self::STATUS_SENDING, 
            self::STATUS_SENT, 
            self::STATUS_PARTIALLY_SENT
        ]);
    }
    
    /**
     * Vérifie si la campagne peut être annulée
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            self::STATUS_SCHEDULED, 
            self::STATUS_SENDING, 
            self::STATUS_PAUSED
        ]);
    }
    
    /**
     * Vérifie si la campagne peut être réessayée
     */
    public function canBeRetried(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }
} 