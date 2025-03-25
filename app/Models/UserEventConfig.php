<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserEventConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'event_type_id',
        'is_active',
        'custom_template',
        'days_before',
        'audience_override',
        'last_processed_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'audience_override' => 'array',
        'last_processed_at' => 'datetime'
    ];

    /**
     * Obtenir l'utilisateur associé
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtenir le type d'événement associé
     */
    public function eventType()
    {
        return $this->belongsTo(EventType::class);
    }
    
    /**
     * Obtenir le modèle de message à utiliser (personnalisé ou par défaut)
     */
    public function getMessageTemplate()
    {
        return $this->custom_template ?: $this->eventType->default_template;
    }
    
    /**
     * Obtenir les paramètres d'audience (personnalisés ou par défaut)
     */
    public function getAudienceParameters()
    {
        return $this->audience_override ?: $this->eventType->getAudienceParameters();
    }
    
    /**
     * Marquer cet événement comme traité
     */
    public function markAsProcessed()
    {
        $this->last_processed_at = now();
        $this->save();
    }
} 