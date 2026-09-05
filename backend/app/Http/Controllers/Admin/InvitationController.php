<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvitationRequest;
use App\Http\Requests\UpdateInvitationRequest;
use App\Http\Resources\InvitationResource;
use App\Models\Invitation;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvitationController extends Controller
{
    use AuthorizesInvitationAccess;

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = Invitation::query()->latest();

        if ($user->isClient()) {
            $query->where('owner_id', $user->id);
        }

        return InvitationResource::collection($query->get());
    }

    public function store(StoreInvitationRequest $request): InvitationResource
    {
        if (! $request->user()->isAdmin()) {
            throw new AuthorizationException('Only an admin can create invitations.');
        }

        $invitation = Invitation::create($request->validated());

        $invitation->detail()->create([
            'connector' => $invitation->type === 'wedding' ? '&' : null,
        ]);

        if ($invitation->type === 'wedding') {
            $invitation->people()->createMany([
                ['role' => 'bride', 'first_name' => 'Bride'],
                ['role' => 'groom', 'first_name' => 'Groom'],
            ]);
        } else {
            $invitation->people()->create([
                'role' => 'celebrant',
                'first_name' => 'Celebrant',
            ]);
        }

        return new InvitationResource($invitation->load(['detail', 'people']));
    }

    public function show(Request $request, Invitation $invitation): InvitationResource
    {
        $this->authorizeInvitation($invitation, $request->user());

        return new InvitationResource(
            $invitation->load(['detail', 'people', 'scheduleEvents', 'milestones', 'galleryImages'])
        );
    }

    public function update(UpdateInvitationRequest $request, Invitation $invitation): InvitationResource
    {
        $user = $request->user();
        $this->authorizeInvitation($invitation, $user);

        $data = $request->validated();

        // Only an admin may reassign which client owns an invitation.
        if (! $user->isAdmin()) {
            unset($data['owner_id']);
        }

        $invitation->update(collect($data)->only([
            'slug', 'is_published', 'meta_title', 'meta_description', 'theme',
            'story_layout', 'animation_intensity', 'owner_id',
        ])->toArray());

        if (! empty($data['detail'])) {
            $invitation->detail()->updateOrCreate([], $data['detail']);
        }

        if (isset($data['people'])) {
            $invitation->people()->delete();
            $invitation->people()->createMany($data['people']);
        }

        return new InvitationResource($invitation->fresh(['detail', 'people']));
    }

    public function destroy(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $invitation->delete();

        return response()->json(status: 204);
    }
}
