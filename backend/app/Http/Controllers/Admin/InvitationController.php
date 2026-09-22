<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvitationRequest;
use App\Http\Requests\UpdateInvitationRequest;
use App\Http\Resources\InvitationResource;
use App\Models\Invitation;
use App\Models\Rsvp;
use App\Models\Wish;
use App\Support\EventTypes;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class InvitationController extends Controller
{
    use AuthorizesInvitationAccess;

    /**
     * Paginated, filterable list — backs the admin dashboard's CMS-style
     * table/grid. `type`/`status`/`search` are all optional; omitting them
     * returns every invitation the user can see, newest first, still paginated.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $query = Invitation::query()->latest();

        if ($user->isClient()) {
            $query->where('owner_id', $user->id);
        }

        if ($type = $request->string('type')->trim()->value()) {
            $query->where('type', $type);
        }

        if ($status = $request->string('status')->trim()->value()) {
            $query->where('is_published', $status === 'published');
        }

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search): void {
                $q->where('slug', 'like', "%{$search}%")
                    ->orWhere('meta_title', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->integer('per_page', 12);
        $perPage = max(1, min($perPage, 100));

        return InvitationResource::collection($query->paginate($perPage));
    }

    /**
     * Headline stats + per-type breakdown for the dashboard summary tiles.
     * Scoped to the user's own invitations for a client, platform-wide for
     * an admin — same visibility rule as index().
     *
     * @return array<string, mixed>
     */
    public function stats(Request $request): array
    {
        $user = $request->user();

        $scope = fn () => Invitation::query()->when(
            $user->isClient(),
            fn ($q) => $q->where('owner_id', $user->id)
        );

        $ids = $scope()->pluck('id');

        $byType = $scope()
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type');

        return [
            'total' => $ids->count(),
            'published' => $scope()->where('is_published', true)->count(),
            'draft' => $scope()->where('is_published', false)->count(),
            'rsvps' => Rsvp::query()->whereIn('invitation_id', $ids)->count(),
            'wishes' => Wish::query()->whereIn('invitation_id', $ids)->count(),
            'by_type' => $byType,
        ];
    }

    public function store(StoreInvitationRequest $request): InvitationResource
    {
        if (! $request->user()->isAdmin()) {
            throw new AuthorizationException('Only an admin can create invitations.');
        }

        $typeConfig = EventTypes::ALL[$request->validated('type')] ?? EventTypes::ALL['wedding'];

        // story_layout/animation_intensity are seeded straight from the type's
        // registry defaults so every event type opens looking and feeling
        // distinct out of the box — see the `default*` keys' doc block on
        // EventTypes::ALL. This is deliberately the only place theme is NOT
        // seeded server-side: defaultThemePreset only names a preset key, and
        // resolving it to actual RGB values is done client-side in
        // Dashboard.jsx (the palette intentionally lives only in
        // frontend/src/admin/themePresets.js, not duplicated here).
        $invitation = Invitation::create($request->validated() + [
            'story_layout' => $typeConfig['defaultStoryLayout'] ?? 'constellation',
            'animation_intensity' => $typeConfig['defaultAnimationIntensity'] ?? 'balanced',
        ]);

        // connector is NOT NULL DEFAULT '&' at the DB level — only override
        // it for wedding (its only meaningful type); every other type keeps
        // the column default rather than an explicit null insert.
        $invitation->detail()->create([
            'envelope_animation' => $typeConfig['defaultEnvelopeAnimation'] ?? 'swing-doors',
            ...($invitation->type === 'wedding' ? ['connector' => '&'] : []),
        ]);

        foreach ($typeConfig['roles'] as $role => $label) {
            $invitation->people()->create([
                'role' => $role,
                'first_name' => $label,
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
