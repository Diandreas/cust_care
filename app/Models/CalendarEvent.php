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

    public function userConfigs()
    {
        return $this->hasMany(UserEventConfig::class, 'event_type_id');
    }

    public function isToday()
    {
        $today = now();
        return $today->format('m') === $this->month && $today->format('d') === $this->day;
    }

    public function getDateForYear($year)
    {
        return \Carbon\Carbon::createFromDate($year, $this->month, $this->day);
    }
}
