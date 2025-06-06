<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

//    protected $fillable = [
//        'user_id',
//        'client_id',
//        'campaign_id',
//        'content',
//        'status',
//        'type',
//        'is_reply',
//        'sent_at',
//        'delivered_at',
//    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'is_reply' => 'boolean',
    ];
    protected $fillable = [
        'user_id', 'client_id', 'campaign_id', 'content', 'status', 'type',
        'is_reply', 'sent_at', 'delivered_at', 'external_id', 'error_code'
    ];


    /**
     * Scope pour les messages du mois
     */
    public function scopeThisMonth($query)
    {
        return $query->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year);
    }

    /**
     * Scope pour les messages envoyés
     */
    public function scopeSent($query)
    {
        return $query->whereIn('status', ['sent', 'delivered']);
    }

    /**
     * Scope pour les messages livrés
     */
    public function scopeDelivered($query)
    {
        return $query->where('status', 'delivered');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }
}
