<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Single enforcement point for "can this logged-in user touch this
 * invitation's data?" — used by every Admin controller that resolves an
 * {invitation} route parameter, so ownership scoping can't be missed on any
 * one of them.
 *
 * Two levels, matching the product's role split:
 *  - authorizeInvitation(): view + guest-response moderation (RSVPs,
 *    wishes). An admin, or the client who owns the invitation.
 *  - authorizeInvitationEdit(): content edits (slug, theme, people,
 *    schedule, story, gallery, uploads, delete). Admin only — clients are
 *    deliberately view-only, and this must be enforced here, not just by
 *    hiding the editor in the UI.
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

        if ($user->isClient() && (int) $invitation->owner_id === (int) $user->id) {
            return;
        }

        throw new AuthorizationException('You do not have access to this invitation.');
    }

    /**
     * @throws AuthorizationException
     */
    protected function authorizeInvitationEdit(Invitation $invitation, User $user): void
    {
        $this->authorizeInvitation($invitation, $user);

        if (! $user->isAdmin()) {
            throw new AuthorizationException('Only an admin can edit invitation content.');
        }
    }
}
