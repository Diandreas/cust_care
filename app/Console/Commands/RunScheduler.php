<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class RunScheduler extends Command
{
    protected $signature = 'scheduler:run';
    protected $description = 'Exécute les tâches planifiées';

    public function handle()
    {
        $tasks = config('scheduler.tasks', []);

        foreach ($tasks as $task) {
            if ($task['schedule'] === 'everyMinute') {
                $this->info("Exécution de la commande: {$task['command']}");
                Artisan::call($task['command']);
            }
            // Ajoutez d'autres logiques de planification selon les besoins
        }

        return Command::SUCCESS;
    }
}
