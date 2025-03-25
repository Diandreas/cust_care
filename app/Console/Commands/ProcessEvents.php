<?php

namespace App\Console\Commands;

use App\Services\EventManagerService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessEvents extends Command
{
    /**
     * Le nom et la signature de la commande console.
     *
     * @var string
     */
    protected $signature = 'app:process-events';

    /**
     * La description de la commande console.
     *
     * @var string
     */
    protected $description = 'Traite tous les événements automatiques programmés pour aujourd\'hui';

    /**
     * Le service de gestion des événements.
     *
     * @var \App\Services\EventManagerService
     */
    protected $eventManager;

    /**
     * Créer une nouvelle instance de commande.
     */
    public function __construct(EventManagerService $eventManager)
    {
        parent::__construct();
        $this->eventManager = $eventManager;
    }

    /**
     * Exécuter la commande console.
     */
    public function handle()
    {
        $this->info('Début du traitement des événements automatiques...');
        Log::info('Démarrage de la tâche de traitement des événements automatiques');
        
        try {
            $result = $this->eventManager->processAllEvents();
            
            $this->info('Traitement des événements automatiques terminé avec succès.');
            Log::info('Traitement des événements automatiques terminé avec succès');
            
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Erreur lors du traitement des événements automatiques: ' . $e->getMessage());
            Log::error('Erreur lors du traitement des événements automatiques', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Command::FAILURE;
        }
    }
} 