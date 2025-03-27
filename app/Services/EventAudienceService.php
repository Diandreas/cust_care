<?php

namespace App\Services;

use App\Models\Client;
use App\Models\EventType;
use App\Models\UserEventConfig;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class EventAudienceService
{
    /**
     * Calculer l'audience estimée pour un événement
     */
    public function calculateEstimatedAudience(EventType $eventType, User $user, ?UserEventConfig $config = null)
    {
        // Si l'événement a une taille d'audience attendue définie
        if ($eventType->expected_audience_size > 0) {
            return $eventType->expected_audience_size;
        }

        // Obtenir la logique d'audience à utiliser
        $audienceLogic = $config && $config->audience_override ?
            $config->audience_override['logic'] ?? $eventType->audience_logic :
            $eventType->audience_logic;

        // Obtenir les paramètres d'audience à utiliser
        $audienceParams = $config && $config->audience_override ?
            $config->audience_override['params'] ?? $eventType->audience_parameters :
            $eventType->audience_parameters;

        // Compter le nombre total de clients
        $totalClients = $user->clients()->count();

        // Appliquer la logique d'audience
        switch ($audienceLogic) {
            case 'all':
                return $totalClients;

            case 'male':
                return $user->clients()->where('gender', 'male')->count();

            case 'female':
                return $user->clients()->where('gender', 'female')->count();

            case 'specific_category':
                if (isset($audienceParams['category_id'])) {
                    return $user->clients()
                        ->where('category_id', $audienceParams['category_id'])
                        ->count();
                }
                return ceil($totalClients / 5); // Estimation par défaut

            case 'specific_tags':
                if (isset($audienceParams['tags']) && !empty($audienceParams['tags'])) {
                    return $user->clients()
                        ->whereHas('tags', function($query) use ($audienceParams) {
                            $query->whereIn('tags.id', $audienceParams['tags']);
                        })
                        ->count();
                }
                return ceil($totalClients / 5); // Estimation par défaut

            case 'age_range':
                if (isset($audienceParams['min_age']) || isset($audienceParams['max_age'])) {
                    $query = $user->clients()->whereNotNull('birthday');

                    if (isset($audienceParams['min_age'])) {
                        $maxBirthdate = now()->subYears($audienceParams['min_age']);
                        $query->where('birthday', '<=', $maxBirthdate);
                    }

                    if (isset($audienceParams['max_age'])) {
                        $minBirthdate = now()->subYears($audienceParams['max_age'] + 1);
                        $query->where('birthday', '>=', $minBirthdate);
                    }

                    return $query->count();
                }
                return ceil($totalClients / 3); // Estimation par défaut

            case 'activity':
                if (isset($audienceParams['active_days'])) {
                    $cutoffDate = now()->subDays($audienceParams['active_days']);
                    return $user->clients()
                        ->whereHas('messages', function($query) use ($cutoffDate) {
                            $query->where('created_at', '>=', $cutoffDate);
                        })
                        ->count();
                }
                return ceil($totalClients / 2); // Estimation par défaut

            default:
                // Pour les événements de type anniversaire
                if (strpos($eventType->code, 'birthday') !== false) {
                    if ($eventType->code === 'client_birthday') {
                        // Événement spécifique à un client
                        return 1;
                    }

                    // Estimation: environ 1/365 des clients ont leur anniversaire un jour donné
                    $birthdayClients = $user->clients()->whereNotNull('birthday')->count();
                    return max(1, ceil($birthdayClients / 365));
                }

                // Par défaut, on considère 10% des clients
                return ceil($totalClients / 10);
        }
    }

    /**
     * Obtenir les clients cibles pour un événement spécifique
     */
    public function getTargetClients(EventType $eventType, User $user, ?UserEventConfig $config = null, $specificDate = null)
    {
        // Obtenir la logique d'audience à utiliser
        $audienceLogic = $config && $config->audience_override ?
            $config->audience_override['logic'] ?? $eventType->audience_logic :
            $eventType->audience_logic;

        // Obtenir les paramètres d'audience à utiliser
        $audienceParams = $config && $config->audience_override ?
            $config->audience_override['params'] ?? $eventType->audience_parameters :
            $eventType->audience_parameters;

        // Base de la requête: tous les clients de l'utilisateur
        $query = $user->clients();

        // Appliquer la logique d'audience
        switch ($audienceLogic) {
            case 'all':
                // Tous les clients, aucun filtre supplémentaire
                break;

            case 'male':
                $query->where('gender', 'male');
                break;

            case 'female':
                $query->where('gender', 'female');
                break;

            case 'specific_category':
                if (isset($audienceParams['category_id'])) {
                    $query->where('category_id', $audienceParams['category_id']);
                }
                break;

            case 'specific_tags':
                if (isset($audienceParams['tags']) && !empty($audienceParams['tags'])) {
                    $query->whereHas('tags', function($q) use ($audienceParams) {
                        $q->whereIn('tags.id', $audienceParams['tags']);
                    });
                }
                break;

            case 'age_range':
                if (isset($audienceParams['min_age']) || isset($audienceParams['max_age'])) {
                    $query->whereNotNull('birthday');

                    if (isset($audienceParams['min_age'])) {
                        $maxBirthdate = now()->subYears($audienceParams['min_age']);
                        $query->where('birthday', '<=', $maxBirthdate);
                    }

                    if (isset($audienceParams['max_age'])) {
                        $minBirthdate = now()->subYears($audienceParams['max_age'] + 1);
                        $query->where('birthday', '>=', $minBirthdate);
                    }
                }
                break;

            case 'activity':
                if (isset($audienceParams['active_days'])) {
                    $cutoffDate = now()->subDays($audienceParams['active_days']);
                    $query->whereHas('messages', function($q) use ($cutoffDate) {
                        $q->where('created_at', '>=', $cutoffDate);
                    });
                }
                break;

            default:
                // Pour les événements de type anniversaire
                if (strpos($eventType->code, 'birthday') !== false) {
                    $query->whereNotNull('birthday');

                    if ($specificDate) {
                        // Sélectionner les clients dont l'anniversaire est à la date spécifiée
                        $month = $specificDate->format('m');
                        $day = $specificDate->format('d');

                        $query->whereRaw("MONTH(birthday) = ?", [$month])
                            ->whereRaw("DAY(birthday) = ?", [$day]);
                    } elseif ($eventType->code === 'client_birthday' && isset($audienceParams['client_id'])) {
                        // Événement d'anniversaire spécifique à un client
                        $query->where('id', $audienceParams['client_id']);
                    } else {
                        // Par défaut, sélectionner les clients dont l'anniversaire est aujourd'hui
                        $today = now();
                        $month = $today->format('m');
                        $day = $today->format('d');

                        $query->whereRaw("MONTH(birthday) = ?", [$month])
                            ->whereRaw("DAY(birthday) = ?", [$day]);
                    }
                }
                break;
        }

        // Exécuter la requête et retourner les résultats
        return $query->get();
    }

    /**
     * Vérifier et ajuster l'audience en fonction des contraintes de quota SMS
     */
    public function checkAndAdjustAudience(EventType $eventType, User $user, $maxSmsAllowed, ?UserEventConfig $config = null)
    {
        // Calculer l'audience estimée
        $estimatedAudience = $this->calculateEstimatedAudience($eventType, $user, $config);

        // Si l'audience estimée dépasse le quota SMS, ajuster l'audience
        if ($estimatedAudience > $maxSmsAllowed) {
            Log::info("Ajustement d'audience nécessaire: {$estimatedAudience} > {$maxSmsAllowed}", [
                'event_type' => $eventType->code,
                'user_id' => $user->id
            ]);

            // Obtenir les clients cibles
            $targetClients = $this->getTargetClients($eventType, $user, $config);

            // Si le nombre de clients est inférieur au quota, pas besoin d'ajustement
            if (count($targetClients) <= $maxSmsAllowed) {
                return [
                    'can_proceed' => true,
                    'audience_size' => count($targetClients),
                    'adjusted' => false
                ];
            }

            // Sinon, limiter le nombre de clients au quota disponible
            // On pourrait prioriser les clients selon certains critères (dernier contact, valeur, etc.)
            $adjustedClients = $targetClients->take($maxSmsAllowed);

            return [
                'can_proceed' => true,
                'audience_size' => count($adjustedClients),
                'adjusted' => true,
                'original_size' => count($targetClients),
                'adjusted_clients' => $adjustedClients->pluck('id')->toArray()
            ];
        }

        // Pas d'ajustement nécessaire
        return [
            'can_proceed' => true,
            'audience_size' => $estimatedAudience,
            'adjusted' => false
        ];
    }

    /**
     * Créer un filtre d'audience personnalisé
     */
    public function createCustomAudienceFilter(array $criteria)
    {
        $audienceOverride = [
            'logic' => 'custom',
            'params' => $criteria
        ];

        // Déterminer la logique principale
        if (isset($criteria['gender'])) {
            $audienceOverride['logic'] = $criteria['gender'];
        } elseif (isset($criteria['category_id'])) {
            $audienceOverride['logic'] = 'specific_category';
        } elseif (isset($criteria['tags']) && !empty($criteria['tags'])) {
            $audienceOverride['logic'] = 'specific_tags';
        } elseif (isset($criteria['min_age']) || isset($criteria['max_age'])) {
            $audienceOverride['logic'] = 'age_range';
        } elseif (isset($criteria['active_days'])) {
            $audienceOverride['logic'] = 'activity';
        }

        return $audienceOverride;
    }
}
