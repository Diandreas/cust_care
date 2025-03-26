<?php

namespace App\Console\Commands;

use App\Jobs\ProcessCampaignJob;
use App\Models\Campaign;
use Illuminate\Console\Command;

class SendScheduledCampaigns extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'campaigns:send-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie toutes les campagnes programmées dont la date est arrivée';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Recherche des campagnes programmées...');

        // Utiliser le QueryBuilder de Laravel 12 pour plus de clarté
        $campaigns = Campaign::query()
            ->where('status', 'scheduled')
            ->where('scheduled_at', '<=', now())
            ->get();

        $count = $campaigns->count();
        $this->info("$count campagnes trouvées à envoyer.");

        $dispatched = 0;

        foreach ($campaigns as $campaign) {
            ProcessCampaignJob::dispatch($campaign);
            $dispatched++;

            $this->info("Campagne #{$campaign->id} '{$campaign->name}' mise en file d'attente");
        }

        $this->info("$dispatched campagnes mises en file d'attente avec succès.");

        return Command::SUCCESS;
    }
}
