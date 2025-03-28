<?php

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\Client;
use App\Models\EventType;
use App\Models\UserEventConfig;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CalendarEventService
{
    /**
     * Obtenir tous les evenements applicables pour un jour specifique
     */
    public function getEventsForDate(Carbon $date): Collection
    {
        $month = $date->format('m');
        $day = $date->format('d');

        // Trouver les evenements du calendrier pour cette date
        return CalendarEvent::where('month', $month)
                          ->where('day', $day)
                          ->where('is_active', true)
                          ->get();
    }

    /**
     * Obtenir tous les evenements pour un mois specifique
     */
    public function getEventsForMonth(int $month, int $year): Collection
    {
        $month = str_pad($month, 2, '0', STR_PAD_LEFT);

        return CalendarEvent::where('month', $month)
                          ->where('is_active', true)
                          ->get();
    }

    /**
     * Calculer le nombre de SMS requis pour un evenement
     */
    public function calculateRequiredSms(EventType $event, UserEventConfig $config = null): int
    {
        // La logique d'audience à appliquer
        $audienceLogic = $config && $config->audience_override
                         ? $config->audience_override['logic'] ?? $event->audience_logic
                         : $event->audience_logic;

        // Le nombre de clients qui recevront un message
        $clientCount = 0;

        switch ($audienceLogic) {
            case 'all':
                $clientCount = Client::count();
                break;
            case 'male':
                $clientCount = Client::where('gender', 'male')->count();
                break;
            case 'female':
                $clientCount = Client::where('gender', 'female')->count();
                break;
            // Autres cas de figure selon vos besoins

            default:
                // Pour les evenements de type anniversaire
                if (strpos($event->code, 'birthday') !== false) {
                    // Obtenir le nombre moyen de clients ayant leur anniversaire chaque jour
                    $clientCount = ceil(Client::whereNotNull('birthday')->count() / 365);
                } else {
                    // Par defaut, estimation de 10% des clients
                    $clientCount = ceil(Client::count() / 10);
                }
        }

        return $clientCount;
    }
}
