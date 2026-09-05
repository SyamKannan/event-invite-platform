<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Single enforcement point for "can this logged-in user touch this
 * invitation's data?" — used by every Admin controller that resolves an
 * {invitation} route parameter, so ownership scoping can't be missed on any
 * one of them. An admin can touch any invitation; a client only their own.
 */
trait AuthorizesInvitationAccess
{
    /**
     * @throws AuthorizationException
     */
    protected function authorizeInvitation(Invitation $invitation, User $user): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if ($user->isClient() && $invitation->owner_id === $user->id) {
            return;
        }

        throw new AuthorizationException('You do not have access to this invitation.');
    }
}
