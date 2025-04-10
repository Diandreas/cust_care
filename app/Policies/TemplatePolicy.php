<?php

namespace App\Policies;

use App\Models\Template;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class TemplatePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Template $template)
    {
        // Un utilisateur peut voir un modèle s'il en est le créateur ou s'il est global
        return $user->id === $template->user_id || $template->is_global;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Template $template)
    {
        // Seul le créateur peut modifier un modèle, même s'il est global
        return $user->id === $template->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Template $template)
    {
        // Seul le créateur peut supprimer un modèle, même s'il est global
        return $user->id === $template->user_id;
    }
} 