<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Exécuter l'automatisation marketing toutes les heures
        $schedule->command('marketing:automation')
            ->hourly()
            ->withoutOverlapping()
            ->runInBackground();

        // Publier les posts programmés toutes les 15 minutes
        $schedule->command('marketing:automation --posts')
            ->everyFifteenMinutes()
            ->withoutOverlapping()
            ->runInBackground();

        // Créer les rappels saisonniers une fois par semaine (dimanche à minuit)
        $schedule->command('marketing:seasonal-reminders')
            ->weekly()
            ->sundays()
            ->at('00:00');

        // Nettoyage des anciens messages (optionnel)
        $schedule->command('cleanup:old-messages')
            ->daily()
            ->at('02:00');

        // Rapport quotidien des performances (optionnel)
        $schedule->command('daily:report')
            ->daily()
            ->at('08:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}