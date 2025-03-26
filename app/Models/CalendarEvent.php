<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CalendarEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'category',
        'is_global',
        'month',
        'day',
        'metadata',
        'is_active'
    ];

    protected $casts = [
        'is_global' => 'boolean',
        'is_active' => 'boolean',
        'metadata' => 'array'
    ];

    /**
     * Les configurations utilisateur liées à cet événement
     */
    public function userConfigs()
    {
        return $this->hasMany(UserEventConfig::class, 'event_type_id');
    }

    /**
     * Vérifier si l'événement tombe aujourd'hui
     */
    public function isToday()
    {
        $today = now();
        return $today->format('m') === $this->month && $today->format('d') === $this->day;
    }

    /**
     * Obtenir la date de l'événement pour l'année en cours
     */
    public function getDateForYear($year)
    {
        return \Carbon\Carbon::createFromDate($year, $this->month, $this->day);
    }
}
