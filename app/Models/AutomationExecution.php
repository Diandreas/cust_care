<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AutomationExecution extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_EXECUTED = 'executed';
    const STATUS_FAILED = 'failed';
    const STATUS_SKIPPED = 'skipped';

    protected $fillable = [
        'automation_rule_id',
        'client_id',
        'status',
        'executed_at',
        'error_message',
        'result_data'
    ];

    protected $casts = [
        'executed_at' => 'datetime',
        'result_data' => 'array'
    ];

    public function automationRule()
    {
        return $this->belongsTo(AutomationRule::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function markAsExecuted(array $resultData = [])
    {
        $this->update([
            'status' => self::STATUS_EXECUTED,
            'executed_at' => now(),
            'result_data' => $resultData
        ]);
    }

    public function markAsFailed(string $errorMessage)
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'executed_at' => now(),
            'error_message' => $errorMessage
        ]);
    }
}