<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
|
| Here you may define all of your scheduled tasks. Laravel will
| automatically execute these tasks based on your defined schedule.
|
*/

// Traitement des campagnes SMS programmées
Schedule::command('campaigns:process-scheduled')
    ->everyMinute()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/campaigns.log'));

// Nettoyage des anciens messages (optionnel)
Schedule::command('sms:cleanup-old-messages')
    ->weekly()
    ->sundays()
    ->at('02:00')
    ->appendOutputTo(storage_path('logs/cleanup.log'));

// Rapport de statistiques quotidien (optionnel)
Schedule::command('sms:daily-report')
    ->dailyAt('09:00')
    ->environments(['production'])
    ->appendOutputTo(storage_path('logs/reports.log'));

// Vérification de la santé du système (optionnel)
Schedule::command('system:health-check')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->when(function () {
        return config('app.env') === 'production';
    });

// Synchronisation des statuts Twilio (optionnel)
Schedule::command('twilio:sync-message-status')
    ->everyTenMinutes()
    ->withoutOverlapping()
    ->appendOutputTo(storage_path('logs/twilio-sync.log'));

// Nettoyage des jobs échoués
Schedule::command('queue:prune-failed', ['--hours=48'])
    ->daily()
    ->at('01:00');

// Optimisation de la base de données
Schedule::command('model:prune')
    ->daily()
    ->at('03:00');

/*
|--------------------------------------------------------------------------
| Custom Scheduled Closures
|--------------------------------------------------------------------------
|
| You may also schedule Closure based tasks directly here.
|
*/

// Exemple de tâche personnalisée avec une closure
Schedule::call(function () {
    // Vérifier les quotas des utilisateurs
    $users = \App\Models\User::whereHas('subscription')->get();

    foreach ($users as $user) {
        $monthlyUsage = \App\Models\Message::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->count();

        $quota = config('services.twilio.quotas')[$user->subscription_plan]['sms_per_month'] ?? 0;

        // Notification si proche du quota (90%)
        if ($monthlyUsage >= ($quota * 0.9)) {
            // Envoyer une notification
            \Log::info("Utilisateur {$user->id} proche du quota : {$monthlyUsage}/{$quota}");
        }
    }
})->daily()->at('08:00')->name('check-user-quotas');

// Sauvegarde des métriques
Schedule::call(function () {
    $metrics = [
        'total_messages' => \App\Models\Message::count(),
        'active_campaigns' => \App\Models\Campaign::whereIn('status', ['sending', 'scheduled'])->count(),
        'active_users' => \App\Models\User::whereHas('messages', function($q) {
            $q->where('created_at', '>=', now()->subDays(30));
        })->count(),
        'timestamp' => now()
    ];

    \Log::channel('metrics')->info('Daily metrics', $metrics);
})->daily()->at('23:59')->name('save-daily-metrics');
