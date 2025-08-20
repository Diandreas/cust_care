<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\AutomaticEventsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\CampaignRetryController;
use App\Http\Controllers\EventCalendarController;
use App\Http\Controllers\ClientImportController;
use App\Http\Controllers\TwilioController;
use App\Http\Middleware\CheckClientLimit;
use App\Http\Middleware\EnsureUserHasActiveSubscription;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\MarketingAssistantController;
use App\Http\Controllers\FlyerController;
use App\Http\Controllers\MarketingClientController;
use App\Http\Controllers\MarketingCampaignController;
use App\Http\Controllers\MarketingAutomationController;
use App\Http\Controllers\MarketingContentTemplateController;
use App\Http\Controllers\MarketingFlyerController;
use App\Http\Controllers\MarketingAIController;
use App\Http\Controllers\MarketingWhatsAppController;
use App\Http\Controllers\MarketingChatController;
use App\Http\Controllers\MarketingAnalyticsController;

// Page d'accueil
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});
Route::middleware(['auth'])->group(function () {
    // Route pour analyser les fichiers Excel
    Route::post('/parse-excel', [App\Http\Controllers\ClientController::class, 'parseExcel'])
        ->name('api.parse-excel');

    // Route pour obtenir le statut d'une importation en cours
    Route::get('/import-status/{jobId}', [App\Http\Controllers\ClientController::class, 'getImportStatus'])
        ->name('api.import-status');
});

// Routes nécessitant une authentification
Route::middleware(['auth'])->group(function () {
    // Tableau de bord
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/campaigns/{campaign}/retry', [CampaignController::class, 'retry'])->name('campaigns.retry');

    // API Routes
    Route::prefix('api')->group(function () {
        // API pour les visites clients
        Route::post('/clients/{client}/visit', [ClientController::class, 'recordVisit']);
        Route::get('/clients/{client}/visits', [ClientController::class, 'getVisitHistory']);

        // Nouvelle route pour l'envoi de messages directs
        Route::post('/clients/{client}/message', [ClientController::class, 'sendMessage']);
    });


    // IMPORTANT: Les routes spécifiques doivent être placées AVANT la route resource
    // Route d'exportation des clients
    Route::get('/clients/export', [App\Http\Controllers\ImportExportController::class, 'export'])->name('clients.export');

    // Route d'importation des clients
    Route::middleware(CheckClientLimit::class)->post('/clients/import', [App\Http\Controllers\ImportExportController::class, 'import'])->name('clients.import');

    // Route pour la page d'importation/exportation
    Route::get('/clients/import-export', function () {
        return Inertia::render('Clients/ImportExport');
    })->name('clients.import-export');

    // Route pour l'importation simple
    Route::middleware(CheckClientLimit::class)->post('/clients/import/simple', [App\Http\Controllers\ClientImportController::class, 'store'])->name('clients.import.simple');

    // Route de suppression en masse des clients
    Route::delete('/api/clients/bulk-delete', [ClientController::class, 'bulkDelete'])->name('clients.bulkDelete');

    // Route pour l'envoi en masse de messages
    Route::post('/messages/bulkSend', [ClientController::class, 'bulkSend'])->name('messages.bulkSend');

    // Route pour la fusion de clients en double
    Route::post('/api/clients/merge', function (\Illuminate\Http\Request $request) {
        $request->validate([
            'primary_id' => 'required|exists:clients,id',
            'secondary_id' => 'required|exists:clients,id|different:primary_id'
        ]);

        $primaryId = $request->input('primary_id');
        $secondaryId = $request->input('secondary_id');

        // Récupérer les clients
        $primaryClient = \App\Models\Client::findOrFail($primaryId);
        $secondaryClient = \App\Models\Client::findOrFail($secondaryId);

        // Vérifier que les deux clients appartiennent à l'utilisateur connecté
        if ($primaryClient->user_id !== auth()->id() || $secondaryClient->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Fusionner les messages
        \App\Models\Message::where('client_id', $secondaryId)
            ->update(['client_id' => $primaryId]);

        // Fusionner les tags
        $primaryTags = $primaryClient->tags()->pluck('tags.id')->toArray();
        $secondaryTags = $secondaryClient->tags()->pluck('tags.id')->toArray();
        $mergedTags = array_unique(array_merge($primaryTags, $secondaryTags));
        $primaryClient->tags()->sync($mergedTags);

        // Copier les champs non vides du client secondaire vers le client primaire
        $fieldsToCopy = ['email', 'birthday', 'address', 'notes'];
        foreach ($fieldsToCopy as $field) {
            if (empty($primaryClient->$field) && !empty($secondaryClient->$field)) {
                $primaryClient->$field = $secondaryClient->$field;
            }
        }
        $primaryClient->save();

        // Supprimer le client secondaire
        $secondaryClient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Clients fusionnés avec succès',
            'client' => $primaryClient->load('tags')
        ]);
    })->name('clients.merge');

    // Routes pour les visites clients
    Route::post('/clients/{client}/visit', [ClientController::class, 'recordVisit'])->name('clients.recordVisit');
    Route::get('/clients/{client}/visits', [ClientController::class, 'getVisitHistory'])->name('clients.visits');

    // Nouvelle route pour l'envoi de messages directs
    Route::post('/clients/{client}/message', [ClientController::class, 'sendMessage'])->name('clients.message');

    // Route de création avec middleware client.limit
    Route::middleware(CheckClientLimit::class)->post('/clients', [ClientController::class, 'store'])->name('clients.store');

    // Resource clients SANS la méthode store (définie manuellement ci-dessus)
    Route::resource('clients', ClientController::class)->except('store');

    // Tags
    Route::resource('tags', TagController::class);

    // Abonnement
    Route::prefix('subscription')->group(function () {
        Route::get('/', [SubscriptionController::class, 'index'])->name('subscription.index');
        Route::get('/dashboard', [SubscriptionController::class, 'dashboard'])->name('subscription.dashboard');
        Route::get('/plans', [SubscriptionController::class, 'plans'])->name('subscription.plans');
        Route::post('/subscribe', [SubscriptionController::class, 'subscribe'])->name('subscription.subscribe');
        Route::post('/plans/{plan}/subscribe', [PaymentController::class, 'processSubscriptionPayment'])->name('subscription.plans.subscribe');
        Route::get('/addons', [SubscriptionController::class, 'addons'])->name('subscription.addons.index');
        Route::post('/addons', [PaymentController::class, 'processAddonPayment'])->name('subscription.addons');
        Route::get('/transactions', [SubscriptionController::class, 'transactions'])->name('subscription.transactions');
        Route::get('/top-up', [SubscriptionController::class, 'topUp'])->name('subscription.top-up');
        Route::get('/increase-limit', [SubscriptionController::class, 'increaseLimit'])->name('subscription.increase-limit');
        Route::post('/toggle-auto-renew', [SubscriptionController::class, 'toggleAutoRenew'])->name('subscription.toggle-auto-renew');
        Route::post('/cancel', [SubscriptionController::class, 'cancelAtPeriodEnd'])->name('subscription.cancel');
        Route::post('/topup', [SubscriptionController::class, 'topup'])->name('subscription.topup');
        Route::get('/invoices', [SubscriptionController::class, 'invoices'])->name('subscription.invoices');
    });

    // Paiement
    Route::get('payment/confirmation', [PaymentController::class, 'showPaymentConfirmation'])->name('payment.confirmation');
    Route::match(['get', 'post'], 'payment/subscription/{plan}', [PaymentController::class, 'processSubscriptionPayment'])->name('payment.subscription');
    Route::match(['get', 'post'], 'payment/addon', [PaymentController::class, 'processAddonPayment'])->name('payment.addon');

    // Routes pour les paiements d'abonnement
    Route::post('api/notchpay/subscribe', [App\Http\Controllers\Payment\NotchPayController::class, 'initializeSubscriptionPayment'])
        ->name('subscription.notchpay.initialize')
        ->middleware('auth');

    Route::get('subscription/notchpay/callback', [App\Http\Controllers\Payment\NotchPayController::class, 'handleSubscriptionCallback'])
        ->name('subscription.notchpay.callback');

    Route::post('api/notchpay/addon', [App\Http\Controllers\Payment\NotchPayController::class, 'initializeAddonPayment'])
        ->name('addon.notchpay.initialize')
        ->middleware('auth');

    Route::get('addon/notchpay/callback', [App\Http\Controllers\Payment\NotchPayController::class, 'handleAddonCallback'])
        ->name('addon.notchpay.callback');

    Route::post('api/paypal/subscribe', [App\Http\Controllers\Payment\PayPalController::class, 'captureSubscriptionPayment'])
        ->name('subscription.paypal.capture')
        ->middleware('auth');

    Route::post('api/paypal/addon', [App\Http\Controllers\Payment\PayPalController::class, 'captureAddonPayment'])
        ->name('addon.paypal.capture')
        ->middleware('auth');

    // Routes nécessitant un abonnement actif
    Route::middleware([EnsureUserHasActiveSubscription::class])->group(function () {
        // Campagnes
        Route::resource('campaigns', CampaignController::class);
        Route::put('campaigns/{campaign}/status', [CampaignController::class, 'changeStatus'])->name('campaigns.status');

        // Bulk actions pour les campagnes
        Route::post('/campaigns/bulk-disable', [CampaignController::class, 'bulkDisable'])->name('campaigns.bulk-disable');
        Route::post('/campaigns/bulk-enable', [CampaignController::class, 'bulkEnable'])->name('campaigns.bulk-enable');
        Route::post('/campaigns/bulk-delete', [CampaignController::class, 'bulkDelete'])->name('campaigns.bulk-delete');

        // Quick add campaign route
        Route::post('/campaigns/quick-add', [CampaignController::class, 'quickAdd'])->name('campaigns.quick-add');

        // Reschedule campaign via drag-drop
        Route::put('/campaigns/{campaign}/reschedule', [CampaignController::class, 'reschedule'])->name('campaigns.reschedule');

        // Messages et templates
        Route::resource('messages', MessageController::class);
        Route::resource('templates', TemplateController::class);

        // Événements automatiques

        // Importation de clients
        Route::get('client-import', [ClientImportController::class, 'index'])->name('client-import');
        Route::post('client-import/upload', [ClientImportController::class, 'upload'])->name('client-import.upload');
        Route::post('client-import/process', [ClientImportController::class, 'process'])->name('client-import.process');
        Route::get('client-import/template', [ClientImportController::class, 'downloadTemplate'])->name('client-import.template');
    });

    // Pour le développement seulement - Activation directe d'abonnement
    Route::match(['get', 'post'], 'payment/direct-activation/{plan}/{duration?}', [PaymentController::class, 'directActivation'])
        ->name('payment.direct.activation');

    // Route d'activation directe pour les tests
    Route::match(['get', 'post'], '/direct-activate-plan/{plan}/{duration?}', [PaymentController::class, 'directActivation'])
        ->name('direct.activate.plan');

    // Profil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Routes pour les clients
Route::middleware(['auth', 'verified'])->group(function () {

    Route::resource('clients', ClientController::class);
    Route::post('clients/import/simple', [ClientImportController::class, 'store'])->name('clients.import.simple');
    Route::delete('api/clients/bulk-delete', [ClientController::class, 'bulkDelete']);
});

// Routes pour l'assistant marketing digital
Route::middleware(['auth'])->prefix('assistant-marketing')->name('marketing.')->group(function () {
    // Dashboard principal
    Route::get('/', [MarketingAssistantController::class, 'dashboard'])->name('dashboard');
    
    // Chat avec l'IA
    Route::get('/chat', [MarketingAssistantController::class, 'chat'])->name('chat');
    Route::post('/chat/message', [MarketingAssistantController::class, 'chatMessage'])->name('chat.message');
    
    // Génération de contenu
    Route::post('/generate-content', [MarketingAssistantController::class, 'generateContent'])->name('generate.content');
    Route::post('/save-content', [MarketingAssistantController::class, 'saveGeneratedContent'])->name('save.content');
    Route::post('/optimize-content', [MarketingAssistantController::class, 'optimizeContent'])->name('optimize.content');
    
    // WhatsApp
    Route::get('/whatsapp', [MarketingAssistantController::class, 'whatsappConversations'])->name('whatsapp.index');
    Route::post('/whatsapp/send', [MarketingAssistantController::class, 'sendWhatsAppMessage'])->name('whatsapp.send');
    Route::post('/whatsapp/bulk-send', [MarketingAssistantController::class, 'bulkWhatsAppMessage'])->name('whatsapp.bulk');
    
    // Publications sur les réseaux sociaux
    Route::post('/posts/schedule', [MarketingAssistantController::class, 'schedulePost'])->name('posts.schedule');
    
    // Automatisation
    Route::post('/automation/rules', [MarketingAssistantController::class, 'createAutomationRule'])->name('automation.rules.store');
    Route::post('/automation/seasonal', [MarketingAssistantController::class, 'createSeasonalReminder'])->name('automation.seasonal');
    
    // Templates
    Route::get('/templates', [MarketingAssistantController::class, 'getTemplates'])->name('templates.index');
    Route::post('/templates', [MarketingAssistantController::class, 'saveTemplate'])->name('templates.store');
});

// Routes pour le générateur de flyers
Route::middleware(['auth'])->prefix('flyers')->name('flyers.')->group(function () {
    Route::get('/', [FlyerController::class, 'index'])->name('index');
    Route::get('/create', [FlyerController::class, 'create'])->name('create');
    Route::post('/', [FlyerController::class, 'store'])->name('store');
    Route::get('/{flyer}', [FlyerController::class, 'show'])->name('show');
    Route::get('/{flyer}/edit', [FlyerController::class, 'edit'])->name('edit');
    Route::put('/{flyer}', [FlyerController::class, 'update'])->name('update');
    Route::delete('/{flyer}', [FlyerController::class, 'destroy'])->name('destroy');
    
    // Fonctionnalités spéciales
    Route::post('/generate-content', [FlyerController::class, 'generateContent'])->name('generate.content');
    Route::post('/{flyer}/export', [FlyerController::class, 'export'])->name('export');
    Route::post('/{flyer}/duplicate', [FlyerController::class, 'duplicate'])->name('duplicate');
    Route::get('/templates/default', [FlyerController::class, 'getDefaultTemplates'])->name('templates.default');
});

// Webhook pour WhatsApp (Twilio)
Route::post('/webhooks/whatsapp', function (Illuminate\Http\Request $request) {
    $whatsappService = app(\App\Services\WhatsAppService::class);
    $whatsappService->processIncomingMessage($request->all());
    return response('OK', 200);
})->name('webhooks.whatsapp');

// Routes pour les paramètres et la configuration Twilio
Route::prefix('webhooks/twilio')->group(function () {
    Route::post('/sms', [TwilioController::class, 'receiveSMS'])->name('twilio.sms.receive');
    Route::post('/voice', [TwilioController::class, 'receiveCall'])->name('twilio.voice.receive');
    Route::post('/status', [TwilioController::class, 'statusCallback'])->name('twilio.status.callback');
});
Route::middleware(['auth'])->prefix('admin/twilio')->group(function () {
    Route::get('/dashboard', [TwilioController::class, 'getDashboard'])->name('twilio.dashboard');
    Route::post('/campaigns', [TwilioController::class, 'createCampaign'])->name('twilio.campaigns.create');
    Route::post('/sms/send', [TwilioController::class, 'sendQuickSms'])->name('twilio.sms.send');
});
require __DIR__.'/auth.php';

// Routes Marketing Digital
Route::middleware(['auth', 'verified'])->prefix('marketing')->name('marketing.')->group(function () {
    // Tableau de bord principal
    Route::get('/dashboard', function () {
        return Inertia::render('Marketing/Dashboard');
    })->name('dashboard');

    // Gestion des clients
    Route::resource('clients', MarketingClientController::class);
    Route::post('clients/{client}/send-message', [MarketingClientController::class, 'sendMessage'])->name('clients.send-message');
    Route::post('clients/import', [MarketingClientController::class, 'import'])->name('clients.import');
    Route::get('clients/export', [MarketingClientController::class, 'export'])->name('clients.export');
    Route::post('clients/bulk-action', [MarketingClientController::class, 'bulkAction'])->name('clients.bulk-action');

    // Gestion des campagnes
    Route::resource('campaigns', MarketingCampaignController::class);
    Route::post('campaigns/{campaign}/start', [MarketingCampaignController::class, 'start'])->name('campaigns.start');
    Route::post('campaigns/{campaign}/pause', [MarketingCampaignController::class, 'pause'])->name('campaigns.pause');
    Route::post('campaigns/{campaign}/resume', [MarketingCampaignController::class, 'resume'])->name('campaigns.resume');
    Route::post('campaigns/{campaign}/complete', [MarketingCampaignController::class, 'complete'])->name('campaigns.complete');
    Route::post('campaigns/{campaign}/cancel', [MarketingCampaignController::class, 'cancel'])->name('campaigns.cancel');
    Route::post('campaigns/{campaign}/schedule', [MarketingCampaignController::class, 'schedule'])->name('campaigns.schedule');
    Route::post('campaigns/{campaign}/send', [MarketingCampaignController::class, 'send'])->name('campaigns.send');

    // Gestion des automatisations
    Route::resource('automations', MarketingAutomationController::class);
    Route::post('automations/{automation}/activate', [MarketingAutomationController::class, 'activate'])->name('automations.activate');
    Route::post('automations/{automation}/deactivate', [MarketingAutomationController::class, 'deactivate'])->name('automations.deactivate');
    Route::post('automations/{automation}/execute', [MarketingAutomationController::class, 'execute'])->name('automations.execute');
    Route::post('automations/{automation}/duplicate', [MarketingAutomationController::class, 'duplicate'])->name('automations.duplicate');
    Route::post('automations/birthday-rule', [MarketingAutomationController::class, 'createBirthdayRule'])->name('automations.birthday-rule');
    Route::post('automations/seasonal-rule', [MarketingAutomationController::class, 'createSeasonalRule'])->name('automations.seasonal-rule');
    Route::post('automations/new-client-rule', [MarketingAutomationController::class, 'createNewClientRule'])->name('automations.new-client-rule');
    Route::post('automations/inactive-client-rule', [MarketingAutomationController::class, 'createInactiveClientRule'])->name('automations.inactive-client-rule');
    Route::post('automations/create-defaults', [MarketingAutomationController::class, 'createDefaultRules'])->name('automations.create-defaults');

    // Gestion des templates de contenu
    Route::resource('templates', MarketingContentTemplateController::class);
    Route::post('templates/{template}/activate', [MarketingContentTemplateController::class, 'activate'])->name('templates.activate');
    Route::post('templates/{template}/deactivate', [MarketingContentTemplateController::class, 'deactivate'])->name('templates.deactivate');
    Route::post('templates/{template}/duplicate', [MarketingContentTemplateController::class, 'duplicate'])->name('templates.duplicate');
    Route::post('templates/{template}/generate-content', [MarketingContentTemplateController::class, 'generateContent'])->name('templates.generate-content');

    // Gestion des flyers
    Route::resource('flyers', MarketingFlyerController::class);
    Route::post('flyers/{flyer}/publish', [MarketingFlyerController::class, 'publish'])->name('flyers.publish');
    Route::post('flyers/{flyer}/archive', [MarketingFlyerController::class, 'archive'])->name('flyers.archive');
    Route::post('flyers/{flyer}/duplicate', [MarketingFlyerController::class, 'duplicate'])->name('flyers.duplicate');
    Route::get('flyers/{flyer}/preview', [MarketingFlyerController::class, 'preview'])->name('flyers.preview');
    Route::post('flyers/{flyer}/export', [MarketingFlyerController::class, 'export'])->name('flyers.export');
    Route::post('flyers/{flyer}/apply-template', [MarketingFlyerController::class, 'applyTemplate'])->name('flyers.apply-template');
    Route::post('flyers/{flyer}/generate-ai-content', [MarketingFlyerController::class, 'generateAIContent'])->name('flyers.generate-ai-content');

    // Assistant IA
    Route::get('ai/assistant', function () {
        return Inertia::render('Marketing/AI/Assistant');
    })->name('ai.assistant');
    Route::post('ai/chat', [MarketingAIController::class, 'chat'])->name('ai.chat');
    Route::post('ai/generate-content', [MarketingAIController::class, 'generateContent'])->name('ai.generate-content');
    Route::post('ai/generate-article', [MarketingAIController::class, 'generateArticle'])->name('ai.generate-article');
    Route::post('ai/generate-social-post', [MarketingAIController::class, 'generateSocialPost'])->name('ai.generate-social-post');
    Route::post('ai/generate-flyer-content', [MarketingAIController::class, 'generateFlyerContent'])->name('ai.generate-flyer-content');
    Route::post('ai/generate-personalized-message', [MarketingAIController::class, 'generatePersonalizedMessage'])->name('ai.generate-personalized-message');
    Route::post('ai/optimize-content', [MarketingAIController::class, 'optimizeContent'])->name('ai.optimize-content');
    Route::post('ai/generate-suggestions', [MarketingAIController::class, 'generateSuggestions'])->name('ai.generate-suggestions');

    // WhatsApp Business
    Route::get('whatsapp/conversations', [MarketingWhatsAppController::class, 'conversations'])->name('whatsapp.conversations');
    Route::get('whatsapp/conversations/{conversation}', [MarketingWhatsAppController::class, 'showConversation'])->name('whatsapp.conversations.show');
    Route::post('whatsapp/conversations/{conversation}/reply', [MarketingWhatsAppController::class, 'reply'])->name('whatsapp.conversations.reply');
    Route::get('whatsapp/stats', [MarketingWhatsAppController::class, 'stats'])->name('whatsapp.stats');
    Route::get('whatsapp/test-connection', [MarketingWhatsAppController::class, 'testConnection'])->name('whatsapp.test-connection');
});
