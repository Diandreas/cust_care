<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Notification;
use App\Channels\TwilioChannel;
use App\Services\TwilioService;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Enregistrer le canal de notification Twilio
        Notification::extend('twilio', function ($app) {
            return new TwilioChannel($app->make(TwilioService::class));
        });

        // Définir la longueur maximale pour les index de champs string
        Schema::defaultStringLength(191);
    }
}
