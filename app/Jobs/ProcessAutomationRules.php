<?php

namespace App\Jobs;

use App\Services\AutomationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessAutomationRules implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    public function handle(AutomationService $automationService): void
    {
        try {
            $executedCount = $automationService->executeAllActiveRules();
            
            Log::info("Automation rules processed successfully", [
                'executed_count' => $executedCount
            ]);

        } catch (\Exception $e) {
            Log::error("Error processing automation rules: " . $e->getMessage());
            throw $e;
        }
    }
}