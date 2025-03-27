<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CategoryController;
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

// Routes nécessitant une authentification
Route::middleware(['auth', 'verified', 'web'])->group(function () {
    // Tableau de bord
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/campaigns/{campaign}/retry', [CampaignController::class, 'retry'])->name('campaigns.retry');
    
    // Calendrier des événements
    Route::get('/event-calendar', [EventCalendarController::class, 'index'])->name('event-calendar.index');
    Route::post('/event-calendar/bulk-toggle', [EventCalendarController::class, 'bulkToggle'])->name('event-calendar.bulk-toggle');
    
    // IMPORTANT: Les routes spécifiques doivent être placées AVANT la route resource
    // Route d'exportation des clients
    Route::get('/clients/export', [ClientController::class, 'export'])->name('clients.export');

    // Route d'importation des clients
    Route::middleware(CheckClientLimit::class)->post('/clients/import', [ClientController::class, 'import'])->name('clients.import');

    // Route de suppression en masse des clients
    Route::delete('/clients/bulk-destroy', [ClientController::class, 'bulkDestroy'])->name('clients.bulkDestroy');

    // Route de création avec middleware client.limit
    Route::middleware(CheckClientLimit::class)->post('/clients', [ClientController::class, 'store'])->name('clients.store');

    // Resource clients SANS la méthode store (définie manuellement ci-dessus)
    Route::resource('clients', ClientController::class)->except('store');

    // Tags
    Route::resource('tags', TagController::class);

    // Catégories
    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);

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
        
        // Diagnostics et retries pour les campagnes échouées
        Route::get('campaigns/{campaign}/diagnostics', [CampaignRetryController::class, 'diagnostics'])->name('campaigns.diagnostics');
        Route::post('campaigns/{campaign}/retry-failed', [CampaignRetryController::class, 'retryFailed'])->name('campaigns.retry.failed');
        Route::post('campaigns/{campaign}/retry-all', [CampaignRetryController::class, 'retryAll'])->name('campaigns.retry.all');

        // Messages
        Route::resource('messages', MessageController::class)->except(['edit', 'update', 'destroy']);

        // Modèles
        Route::resource('templates', TemplateController::class)->except(['create', 'edit', 'show']);

        // Événements automatiques
        Route::resource('automatic-events', AutomaticEventsController::class)->except(['create', 'edit', 'show']);
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

require __DIR__.'/auth.php';
