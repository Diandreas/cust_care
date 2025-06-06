<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TwilioController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Routes publiques (sans authentification)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Routes Webhooks Twilio (sans authentification mais avec validation de signature)
Route::prefix('webhooks/twilio')->group(function () {
    Route::post('/sms', [TwilioController::class, 'receiveSMS'])->name('twilio.sms.receive');
    Route::post('/whatsapp', [TwilioController::class, 'receiveWhatsApp'])->name('twilio.whatsapp.receive');
    Route::post('/voice', [TwilioController::class, 'receiveCall'])->name('twilio.voice.receive');
    Route::post('/status', [TwilioController::class, 'statusCallback'])->name('twilio.status.callback');
    Route::post('/voice/menu', [TwilioController::class, 'handleVoiceMenu'])->name('twilio.voice.menu');
    Route::post('/voice/agent', [TwilioController::class, 'connectToAgent'])->name('twilio.voice.agent');
    Route::post('/voice/recording', [TwilioController::class, 'handleRecording'])->name('twilio.voice.recording');
    Route::post('/voice/transcription', [TwilioController::class, 'handleTranscription'])->name('twilio.voice.transcription');
    Route::post('/voice/outbound', [TwilioController::class, 'handleOutboundCall'])->name('twilio.voice.outbound');
    Route::post('/voice/outbound/action', [TwilioController::class, 'handleOutboundCallAction'])->name('twilio.voice.outbound.action');
});

// Routes avec authentification
Route::middleware(['auth:sanctum'])->group(function () {

    // Routes utilisateur
    Route::prefix('user')->group(function () {
        Route::get('/profile', function (Request $request) {
            return $request->user();
        });
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::delete('/account', [AuthController::class, 'deleteAccount']);
    });

    // Dashboard et statistiques
    Route::prefix('dashboard')->group(function () {
        Route::get('/', [TwilioController::class, 'getDashboard']);
        Route::get('/stats', [DashboardController::class, 'getStats']);
        Route::get('/analytics', [DashboardController::class, 'getAnalytics']);
        Route::get('/recent-activity', [DashboardController::class, 'getRecentActivity']);
    });

    // Gestion des clients
    Route::prefix('clients')->group(function () {
        Route::get('/', [ClientController::class, 'index']);
        Route::post('/', [ClientController::class, 'store']);
        Route::get('/{client}', [ClientController::class, 'show']);
        Route::put('/{client}', [ClientController::class, 'update']);
        Route::delete('/{client}', [ClientController::class, 'destroy']);
        Route::get('/{client}/messages', [ClientController::class, 'getMessages']);
        Route::post('/{client}/opt-out', [ClientController::class, 'optOut']);
        Route::post('/{client}/opt-in', [ClientController::class, 'optIn']);
        Route::post('/import', [ClientController::class, 'import']);
        Route::get('/export', [ClientController::class, 'export']);
        Route::post('/bulk-delete', [ClientController::class, 'bulkDelete']);
        Route::post('/bulk-opt-out', [ClientController::class, 'bulkOptOut']);
    });

    // Gestion des tags
    Route::prefix('tags')->group(function () {
        Route::get('/', [ClientController::class, 'getTags']);
        Route::post('/', [ClientController::class, 'createTag']);
        Route::put('/{tag}', [ClientController::class, 'updateTag']);
        Route::delete('/{tag}', [ClientController::class, 'deleteTag']);
    });

    // Routes Twilio SMS et communication
    Route::prefix('twilio')->group(function () {

        // Envoi de SMS
        Route::prefix('sms')->group(function () {
            Route::post('/send', [TwilioController::class, 'sendQuickSms']);
            Route::post('/send-bulk', [TwilioController::class, 'sendBulkSms']);
            Route::get('/templates', [TwilioController::class, 'getSmsTemplates']);
            Route::post('/templates', [TwilioController::class, 'createSmsTemplate']);
            Route::put('/templates/{template}', [TwilioController::class, 'updateSmsTemplate']);
            Route::delete('/templates/{template}', [TwilioController::class, 'deleteSmsTemplate']);
        });

        // Gestion des campagnes
        Route::prefix('campaigns')->group(function () {
            Route::get('/', [TwilioController::class, 'getCampaigns']);
            Route::post('/', [TwilioController::class, 'createCampaign']);
            Route::get('/{campaign}', [TwilioController::class, 'getCampaign']);
            Route::put('/{campaign}', [TwilioController::class, 'updateCampaign']);
            Route::delete('/{campaign}', [TwilioController::class, 'deleteCampaign']);
            Route::post('/{campaign}/launch', [TwilioController::class, 'launchCampaign']);
            Route::post('/{campaign}/pause', [TwilioController::class, 'pauseCampaign']);
            Route::post('/{campaign}/resume', [TwilioController::class, 'resumeCampaign']);
            Route::post('/{campaign}/cancel', [TwilioController::class, 'cancelCampaign']);
            Route::get('/{campaign}/stats', [TwilioController::class, 'getCampaignStats']);
            Route::get('/{campaign}/messages', [TwilioController::class, 'getCampaignMessages']);
            Route::post('/{campaign}/duplicate', [TwilioController::class, 'duplicateCampaign']);
            Route::post('/schedule', [TwilioController::class, 'scheduleCampaign']);
        });

        // Gestion des numéros de téléphone
        Route::prefix('numbers')->group(function () {
            Route::get('/available', [TwilioController::class, 'getAvailableNumbers']);
            Route::get('/purchased', [TwilioController::class, 'getPurchasedNumbers']);
            Route::post('/purchase', [TwilioController::class, 'purchaseNumber']);
            Route::delete('/{sid}/release', [TwilioController::class, 'releaseNumber']);
            Route::put('/{sid}/configure', [TwilioController::class, 'configureNumber']);
            Route::get('/search', [TwilioController::class, 'searchNumbers']);
        });

        // Configuration Twilio
        Route::prefix('config')->group(function () {
            Route::get('/', [TwilioController::class, 'getConfig']);
            Route::put('/credentials', [TwilioController::class, 'updateCredentials']);
            Route::post('/test-connection', [TwilioController::class, 'testConnection']);
            Route::get('/account-info', [TwilioController::class, 'getAccountInfo']);
            Route::get('/usage', [TwilioController::class, 'getUsage']);
            Route::get('/pricing', [TwilioController::class, 'getPricing']);
        });

        // Messages et historique
        Route::prefix('messages')->group(function () {
            Route::get('/', [TwilioController::class, 'getMessages']);
            Route::get('/{message}', [TwilioController::class, 'getMessage']);
            Route::delete('/{message}', [TwilioController::class, 'deleteMessage']);
            Route::post('/{message}/resend', [TwilioController::class, 'resendMessage']);
            Route::get('/conversations/{phone}', [TwilioController::class, 'getConversation']);
            Route::post('/mark-read', [TwilioController::class, 'markMessagesAsRead']);
        });

        // Automatisation et IA
        Route::prefix('automation')->group(function () {
            Route::get('/events', [TwilioController::class, 'getAutomaticEvents']);
            Route::post('/events', [TwilioController::class, 'createAutomaticEvent']);
            Route::put('/events/{event}', [TwilioController::class, 'updateAutomaticEvent']);
            Route::delete('/events/{event}', [TwilioController::class, 'deleteAutomaticEvent']);
            Route::post('/events/{event}/toggle', [TwilioController::class, 'toggleAutomaticEvent']);
            Route::post('/ai/analyze-campaign', [TwilioController::class, 'analyzeCampaignWithAI']);
            Route::post('/ai/optimize-timing', [TwilioController::class, 'optimizeSendTiming']);
            Route::get('/ai/suggestions', [TwilioController::class, 'getAISuggestions']);
        });

        // Rapports et analytics
        Route::prefix('reports')->group(function () {
            Route::get('/delivery', [TwilioController::class, 'getDeliveryReport']);
            Route::get('/engagement', [TwilioController::class, 'getEngagementReport']);
            Route::get('/performance', [TwilioController::class, 'getPerformanceReport']);
            Route::get('/costs', [TwilioController::class, 'getCostReport']);
            Route::get('/export', [TwilioController::class, 'exportReport']);
            Route::get('/monthly/{year}/{month}', [TwilioController::class, 'getMonthlyReport']);
            Route::get('/campaign-comparison', [TwilioController::class, 'getCampaignComparison']);
        });

        // Segmentation et audiences
        Route::prefix('segments')->group(function () {
            Route::get('/', [TwilioController::class, 'getSegments']);
            Route::post('/', [TwilioController::class, 'createSegment']);
            Route::get('/{segment}', [TwilioController::class, 'getSegment']);
            Route::put('/{segment}', [TwilioController::class, 'updateSegment']);
            Route::delete('/{segment}', [TwilioController::class, 'deleteSegment']);
            Route::get('/{segment}/clients', [TwilioController::class, 'getSegmentClients']);
            Route::post('/{segment}/refresh', [TwilioController::class, 'refreshSegment']);
        });

        // Webhooks et intégrations
        Route::prefix('integrations')->group(function () {
            Route::get('/webhooks', [TwilioController::class, 'getWebhooks']);
            Route::post('/webhooks', [TwilioController::class, 'createWebhook']);
            Route::put('/webhooks/{webhook}', [TwilioController::class, 'updateWebhook']);
            Route::delete('/webhooks/{webhook}', [TwilioController::class, 'deleteWebhook']);
            Route::post('/webhooks/{webhook}/test', [TwilioController::class, 'testWebhook']);
            Route::get('/third-party', [TwilioController::class, 'getThirdPartyIntegrations']);
        });
    });

    // Gestion des abonnements et facturation
    Route::prefix('subscription')->group(function () {
        Route::get('/', [TwilioController::class, 'getSubscription']);
        Route::post('/upgrade', [TwilioController::class, 'upgradeSubscription']);
        Route::post('/downgrade', [TwilioController::class, 'downgradeSubscription']);
        Route::get('/usage', [TwilioController::class, 'getSubscriptionUsage']);
        Route::get('/billing', [TwilioController::class, 'getBillingHistory']);
        Route::post('/payment-method', [TwilioController::class, 'updatePaymentMethod']);
        Route::get('/invoices', [TwilioController::class, 'getInvoices']);
        Route::get('/quotas', [TwilioController::class, 'getQuotas']);
    });

    // Paramètres et configuration utilisateur
    Route::prefix('settings')->group(function () {
        Route::get('/', [TwilioController::class, 'getSettings']);
        Route::put('/general', [TwilioController::class, 'updateGeneralSettings']);
        Route::put('/notifications', [TwilioController::class, 'updateNotificationSettings']);
        Route::put('/privacy', [TwilioController::class, 'updatePrivacySettings']);
        Route::get('/api-keys', [TwilioController::class, 'getApiKeys']);
        Route::post('/api-keys', [TwilioController::class, 'createApiKey']);
        Route::delete('/api-keys/{key}', [TwilioController::class, 'deleteApiKey']);
        Route::post('/export-data', [TwilioController::class, 'exportUserData']);
        Route::get('/compliance', [TwilioController::class, 'getComplianceSettings']);
    });

    // Logs et monitoring
    Route::prefix('logs')->group(function () {
        Route::get('/communications', [TwilioController::class, 'getCommunicationLogs']);
        Route::get('/errors', [TwilioController::class, 'getErrorLogs']);
        Route::get('/activities', [TwilioController::class, 'getActivityLogs']);
        Route::get('/api-calls', [TwilioController::class, 'getApiCallLogs']);
        Route::delete('/clear', [TwilioController::class, 'clearLogs']);
        Route::get('/export', [TwilioController::class, 'exportLogs']);
    });

    // Support et aide
    Route::prefix('support')->group(function () {
        Route::get('/tickets', [TwilioController::class, 'getSupportTickets']);
        Route::post('/tickets', [TwilioController::class, 'createSupportTicket']);
        Route::get('/tickets/{ticket}', [TwilioController::class, 'getSupportTicket']);
        Route::put('/tickets/{ticket}', [TwilioController::class, 'updateSupportTicket']);
        Route::get('/documentation', [TwilioController::class, 'getDocumentation']);
        Route::get('/faq', [TwilioController::class, 'getFAQ']);
        Route::post('/feedback', [TwilioController::class, 'submitFeedback']);
    });

    // Outils et utilitaires
    Route::prefix('tools')->group(function () {
        Route::post('/validate-phone', [TwilioController::class, 'validatePhoneNumber']);
        Route::post('/lookup-carrier', [TwilioController::class, 'lookupCarrier']);
        Route::post('/format-phone', [TwilioController::class, 'formatPhoneNumber']);
        Route::get('/timezones', [TwilioController::class, 'getTimezones']);
        Route::get('/countries', [TwilioController::class, 'getCountries']);
        Route::post('/preview-message', [TwilioController::class, 'previewMessage']);
        Route::post('/test-template', [TwilioController::class, 'testTemplate']);
    });

    // Administration (pour les utilisateurs admin)
    Route::middleware(['admin'])->prefix('admin')->group(function () {
        Route::get('/users', [TwilioController::class, 'getAllUsers']);
        Route::get('/users/{user}/details', [TwilioController::class, 'getUserDetails']);
        Route::put('/users/{user}/subscription', [TwilioController::class, 'updateUserSubscription']);
        Route::get('/system/health', [TwilioController::class, 'getSystemHealth']);
        Route::get('/system/metrics', [TwilioController::class, 'getSystemMetrics']);
        Route::post('/system/maintenance', [TwilioController::class, 'toggleMaintenanceMode']);
        Route::get('/global-stats', [TwilioController::class, 'getGlobalStats']);
        Route::post('/broadcast', [TwilioController::class, 'sendBroadcast']);
    });
});

// Routes de test et développement (à supprimer en production)
Route::prefix('test')->middleware(['auth:sanctum'])->group(function () {
    Route::post('/sms', [TwilioController::class, 'testSms']);
    Route::post('/webhook', [TwilioController::class, 'testWebhook']);
    Route::get('/config', [TwilioController::class, 'testConfig']);
    Route::post('/queue', [TwilioController::class, 'testQueue']);
    Route::get('/logs', [TwilioController::class, 'testLogs']);
});

// Route pour obtenir l'utilisateur authentifié (standard Laravel Sanctum)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user()->load(['subscription', 'twilioNumbers']);
});

// Routes de fallback pour gérer les erreurs 404
Route::fallback(function () {
    return response()->json([
        'message' => 'Route non trouvée.',
        'error' => 'NOT_FOUND'
    ], 404);
});
