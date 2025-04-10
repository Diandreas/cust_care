<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\AutomaticEventsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\CampaignRetryController;
use App\Http\Controllers\EventCalendarController;
use App\Http\Controllers\ClientImportController;
use App\Http\Middleware\CheckClientLimit;
use App\Http\Middleware\EnsureUserHasActiveSubscription;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Page d'accueil
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});
Route::middleware(['auth:sanctum'])->group(function () {
    // Route pour analyser les fichiers Excel
    Route::post('/parse-excel', [App\Http\Controllers\ClientController::class, 'parseExcel'])
        ->name('api.parse-excel');
        
    // Route pour obtenir le statut d'une importation en cours
    Route::get('/import-status/{jobId}', [App\Http\Controllers\ClientController::class, 'getImportStatus'])
        ->name('api.import-status');
});

// Routes nécessitant une authentification
Route::middleware(['auth', 'verified', 'web'])->group(function () {
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
        Route::post('/plans/{plan}/subscribe', [SubscriptionPlanController::class, 'subscribe'])->name('subscription.plans.subscribe');
        Route::get('/addons', [SubscriptionController::class, 'addons'])->name('subscription.addons.index');
        Route::post('/addons', [SubscriptionPlanController::class, 'purchaseAddons'])->name('subscription.addons');
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
    Route::post('payment/subscription/{plan}', [PaymentController::class, 'processSubscriptionPayment'])->name('payment.subscription');
    Route::post('payment/addon', [PaymentController::class, 'processAddonPayment'])->name('payment.addon');

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
    Route::get('payment/direct-activation/{plan}/{duration?}', [PaymentController::class, 'directActivation'])
        ->name('payment.direct.activation');
        
    // Route d'activation directe pour les tests
    Route::get('/direct-activate-plan/{plan}/{duration?}', [PaymentController::class, 'directActivation'])
        ->name('direct.activate.plan');
        
    // Profil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Routes pour les clients
Route::middleware(['auth', 'verified'])->group(function () {

// Routes for bulk actions
Route::post('/campaigns/bulk-disable', [CampaignController::class, 'bulkDisable'])->name('campaigns.bulk-disable');
Route::post('/campaigns/bulk-enable', [CampaignController::class, 'bulkEnable'])->name('campaigns.bulk-enable');
Route::post('/campaigns/bulk-delete', [CampaignController::class, 'bulkDelete'])->name('campaigns.bulk-delete');

// Quick add campaign route
Route::post('/campaigns/quick-add', [CampaignController::class, 'quickAdd'])->name('campaigns.quick-add');

// Reschedule campaign via drag-drop
Route::put('/campaigns/{campaign}/reschedule', [CampaignController::class, 'reschedule'])->name('campaigns.reschedule');


    Route::resource('clients', ClientController::class);
    Route::get('clients/export', [ClientController::class, 'export'])->name('clients.export');
    Route::post('clients/import', [ClientController::class, 'import'])->name('clients.import');
    Route::post('clients/import/simple', [ClientImportController::class, 'store'])->name('clients.import.simple');
    Route::delete('api/clients/bulk-delete', [ClientController::class, 'bulkDelete']);
});

require __DIR__.'/auth.php';