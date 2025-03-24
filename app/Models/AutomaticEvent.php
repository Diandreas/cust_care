<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomaticEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'event_type',
        'message_template',
        'is_active',
        'trigger_date',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'trigger_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 