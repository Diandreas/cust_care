<?php

namespace App\Policies;

use App\Models\Flyer;
use App\Models\User;

class FlyerPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Flyer $flyer): bool
    {
        return $user->id === $flyer->user_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Flyer $flyer): bool
    {
        return $user->id === $flyer->user_id;
    }

    public function delete(User $user, Flyer $flyer): bool
    {
        return $user->id === $flyer->user_id;
    }

    public function restore(User $user, Flyer $flyer): bool
    {
        return $user->id === $flyer->user_id;
    }

    public function forceDelete(User $user, Flyer $flyer): bool
    {
        return $user->id === $flyer->user_id;
    }
}