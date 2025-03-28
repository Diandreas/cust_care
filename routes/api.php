<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WebhookController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});

// Routes pour Twilio
Route::prefix('twilio')->middleware('auth:sanctum')->group(function () {
    Route::post('/send-sms', [WebhookController::class, 'sendSms']);
    Route::post('/send-whatsapp', [WebhookController::class, 'sendWhatsApp']);
}); 