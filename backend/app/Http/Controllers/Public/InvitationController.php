<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvitationConfigResource;
use App\Models\Invitation;

class InvitationController extends Controller
{
    public function show(string $slug): InvitationConfigResource
    {
        $invitation = Invitation::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with(['detail', 'people', 'scheduleEvents', 'milestones', 'galleryImages'])
            ->firstOrFail();

        return new InvitationConfigResource($invitation);
    }
}
