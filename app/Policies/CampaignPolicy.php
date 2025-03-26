<?php

namespace App\Policies;

use App\Models\Campaign;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class CampaignPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Campaign $campaign)
    {
        // Vérifier si l'utilisateur est propriétaire de la campagne
        return $user->id === $campaign->user_id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Campaign $campaign)
    {
        // Vérifier si l'utilisateur est propriétaire ET si la campagne n'est pas déjà envoyée
        // Les campagnes avec le statut 'sent', 'sending', ou 'partially_sent' ne peuvent pas être modifiées
        return $user->id === $campaign->user_id && 
               !in_array($campaign->status, ['sent', 'sending', 'partially_sent']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Campaign $campaign)
    {
        // Les campagnes avec le statut 'sent', 'sending', ou 'partially_sent' ne peuvent pas être supprimées
        return $user->id === $campaign->user_id && 
               !in_array($campaign->status, ['sent', 'sending', 'partially_sent']);
    }
    
    /**
     * Determine whether the user can create a model.
     */
    public function create(User $user)
    {
        return true; // Tous les utilisateurs authentifiés peuvent créer des campagnes
    }
} 