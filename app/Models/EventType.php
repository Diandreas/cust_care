<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventType extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'default_template',
        'is_global',
        'date_type',
        'date_parameters',
        'audience_logic',
        'audience_parameters',
        'is_active'
    ];

    protected $casts = [
        'date_parameters' => 'array',
        'audience_parameters' => 'array',
        'is_global' => 'boolean',
        'is_active' => 'boolean'
    ];

    /**
     * Obtenir les configurations utilisateur pour ce type d'événement
     */
    public function userConfigs()
    {
        return $this->hasMany(UserEventConfig::class);
    }
    
    /**
     * Vérifier si l'événement est lié à un champ client
     */
    public function isClientFieldEvent()
    {
        return $this->date_type === 'client_field';
    }
    
    /**
     * Obtenir le champ client associé à cet événement (si applicable)
     */
    public function getClientField()
    {
        if ($this->date_type !== 'client_field') {
            return null;
        }
        
        return $this->date_parameters['field'] ?? null;
    }
    
    /**
     * Déterminer si l'événement est applicable aujourd'hui (pour événements à date fixe)
     */
    public function isApplicableToday()
    {
        if ($this->date_type === 'fixed_date') {
            $month = $this->date_parameters['month'] ?? null;
            $day = $this->date_parameters['day'] ?? null;
            
            if ($month && $day) {
                $today = now();
                return $today->month == $month && $today->day == $day;
            }
        }
        
        return false;
    }
    
    /**
     * Obtenir les paramètres d'audience
     */
    public function getAudienceParameters()
    {
        return $this->audience_parameters ?? [];
    }
} 