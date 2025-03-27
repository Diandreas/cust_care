<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PendingTransaction extends Model
{
    use HasFactory;

    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'reference',
        'amount',
        'type',
        'status',
        'metadata'
    ];

    /**
     * Les attributs à caster.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
    ];

    /**
     * Obtenir l'utilisateur associé à cette transaction.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 