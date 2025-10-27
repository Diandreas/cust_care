<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Services\AIContentService;

class MarketingChatController extends Controller
{
    private AIContentService $aiContentService;

    public function __construct(AIContentService $aiContentService)
    {
        $this->aiContentService = $aiContentService;
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        try {
            $context = [
                'user_id' => auth()->id(),
                'role' => 'marketing_assistant',
                'capabilities' => [
                    'content_generation',
                    'campaign_management',
                    'analytics_analysis',
                    'whatsapp_integration',
                    'automation_setup',
                ],
            ];

            $result = $this->aiContentService->generateChatResponse($validated['message'], $context);

            if (!($result['success'] ?? false)) {
                return response()->json([
                    'success' => false,
                    'error' => $result['error'] ?? 'AI error',
                    'fallback' => $result['fallback'] ?? null,
                ], 502);
            }

            return response()->json([
                'success' => true,
                'content' => $result['content'] ?? '',
                'usage' => $result['usage'] ?? null,
                'model' => $result['model'] ?? null,
                'message_id' => uniqid('ai_', true),
            ]);
        } catch (\Throwable $e) {
            Log::error('MarketingChatController.sendMessage failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Internal server error',
            ], 500);
        }
    }
}

