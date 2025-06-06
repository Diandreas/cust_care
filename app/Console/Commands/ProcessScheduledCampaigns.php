<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Campaign;
use App\Http\Controllers\TwilioController;

class ProcessScheduledCampaigns extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'campaigns:process-scheduled';

    /**
     * The console command description.
     */
    protected $description = 'Process scheduled SMS campaigns';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $campaigns = Campaign::scheduled()->get();

        if ($campaigns->isEmpty()) {
            $this->info('Aucune campagne programmée à traiter.');
            return 0;
        }

        $twilioController = new TwilioController();

        foreach ($campaigns as $campaign) {
            $this->info("Traitement de la campagne: {$campaign->name}");

            try {
                $campaign->update(['status' => Campaign::STATUS_SENDING]);
                $twilioController->launchCampaign($campaign);

                $this->info("✓ Campagne {$campaign->name} lancée avec succès");

            } catch (\Exception $e) {
                $this->error("✗ Erreur pour la campagne {$campaign->name}: " . $e->getMessage());
                $campaign->update(['status' => Campaign::STATUS_FAILED]);
            }
        }

        $this->info("Traitement terminé. {$campaigns->count()} campagne(s) traitée(s).");
        return 0;
    }
}
