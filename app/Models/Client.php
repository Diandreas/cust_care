<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'birthday',
        'address',
        'notes',
        'gender',
    ];

    protected $casts = [
        'birthday' => 'date',
    ];

    protected $appends = [
        'last_message_date',
        'is_active',
        'last_visit_date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Relation avec les visites
     */
    public function visits()
    {
        return $this->hasMany(Visit::class);
    }

    /**
     * Relation avec les tags (many-to-many)
     */
    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }
    
    /**
     * Obtenir la date du dernier message
     */
    public function getLastMessageDateAttribute()
    {
        return $this->messages()->latest()->value('created_at');
    }
    
    /**
     * Obtenir la date de la dernière visite
     */
    public function getLastVisitDateAttribute()
    {
        return $this->visits()->latest('visit_date')->value('visit_date');
    }
    
    /**
     * Déterminer si le client est actif (au moins un message dans les 90 jours)
     */
    public function getIsActiveAttribute()
    {
        $lastMessage = $this->messages()->latest()->first();
        if (!$lastMessage) return false;
        
        return $lastMessage->created_at->diffInDays(now()) <= 90;
    }
    
    /**
     * Scope pour les clients actifs
     */
    public function scopeActive(Builder $query)
    {
        return $query->whereHas('messages', function ($q) {
            $q->where('created_at', '>=', now()->subDays(90));
        });
    }
    
    /**
     * Scope pour les clients inactifs
     */

     /**
 * Scope pour filtrer les messages reçus
 */
    public function scopeReceived($query)
    {
    return $query->where('type', 'received');
    }

    /**
     * Scope pour filtrer les messages envoyés
     */
    public function scopeSent($query)
    {
    return $query->where('type', 'personal')->orWhere('type', 'promotional');
    }
    public function scopeInactive(Builder $query)
    {
        return $query->whereDoesntHave('messages', function ($q) {
            $q->where('created_at', '>=', now()->subDays(90));
        });
    }
    
    /**
     * Scope pour filtrer par tags
     */
    public function scopeWithTags(Builder $query, array $tagIds)
    {
        return $query->whereHas('tags', function ($q) use ($tagIds) {
            $q->whereIn('tags.id', $tagIds);
        });
    }
} 