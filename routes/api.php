use App\Http\Controllers\ExampleController;

// Routes Twilio
Route::prefix('twilio')->middleware('auth:sanctum')->group(function () {
    Route::post('/send-sms', [ExampleController::class, 'sendSMS']);
    Route::post('/send-whatsapp', [ExampleController::class, 'sendWhatsApp']);
    Route::post('/notify-event', [ExampleController::class, 'notifyEvent']);
    Route::post('/send-email-campaign', [ExampleController::class, 'sendEmailCampaign']);
    Route::post('/send-sms-campaign', [ExampleController::class, 'sendSMSCampaign']);
}); 