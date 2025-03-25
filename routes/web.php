<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\AutomaticEventController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SubscriptionPlanController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\TagController;
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
    
    // Clients
    Route::resource('clients', ClientController::class);
    Route::middleware('client.limit')->post('/clients/import', [ClientController::class, 'import'])->name('clients.import');
    Route::get('/clients/export', [ClientController::class, 'export'])->name('clients.export');
    Route::delete('/clients/bulk-destroy', [ClientController::class, 'bulkDestroy'])->name('clients.bulkDestroy');
    
    // Corriger la route clients.store pour appliquer le middleware client.limit
    Route::middleware('client.limit')->post('/clients', [ClientController::class, 'store'])->name('clients.store');
    
    // Tags
    Route::resource('tags', TagController::class);
    
    // Catégories
    Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);
    
    // Abonnement
    Route::get('subscription', [SubscriptionController::class, 'index'])->name('subscription.index');
    Route::get('subscription/invoices', [SubscriptionController::class, 'invoices'])->name('subscription.invoices');
    
    // Plans d'abonnement
    Route::get('subscription/plans', [SubscriptionPlanController::class, 'index'])->name('subscription.plans');
    Route::get('subscription/plans/{plan}', [SubscriptionPlanController::class, 'show'])->name('subscription.plans.show');
    Route::post('subscription/plans/{plan}/subscribe', [SubscriptionPlanController::class, 'subscribe'])->name('subscription.plans.subscribe');
    Route::get('subscription/addons', [SubscriptionController::class, 'addons'])->name('subscription.addons.index');
    Route::post('subscription/addons', [SubscriptionPlanController::class, 'purchaseAddons'])->name('subscription.addons');
    
    // Paiement
    Route::get('payment/confirmation', [PaymentController::class, 'showPaymentConfirmation'])->name('payment.confirmation');
    Route::post('payment/subscription/{plan}', [PaymentController::class, 'processSubscriptionPayment'])->name('payment.subscription');
    Route::post('payment/addon', [PaymentController::class, 'processAddonPayment'])->name('payment.addon');
    
    // Routes nécessitant un abonnement actif
    Route::middleware(['subscription'])->group(function () {
        // Campagnes
        Route::resource('campaigns', CampaignController::class);
        Route::put('campaigns/{campaign}/status', [CampaignController::class, 'changeStatus'])->name('campaigns.status');
        
        // Messages
        Route::resource('messages', MessageController::class)->except(['edit', 'update', 'destroy']);
        
        // Modèles
        Route::resource('templates', TemplateController::class)->except(['create', 'edit', 'show']);
        
        // Événements automatiques
        Route::resource('automatic-events', AutomaticEventController::class)->except(['create', 'edit', 'show']);
    });
    
    // Profil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
