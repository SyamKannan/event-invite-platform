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
use App\Support\InvitationFiles;
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
            // Escape LIKE wildcards so a search for "100%" or "a_b" matches
            // literally instead of acting as a pattern.
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($q) use ($like): void {
                $q->where('slug', 'like', $like)
                    ->orWhere('meta_title', 'like', $like);
            });
        }

        $perPage = max(1, min($request->integer('per_page', 12), 100));

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

        $byType = $scope()
            ->select('type', DB::raw('count(*) as count'))
            ->groupBy('type')
            ->pluck('count', 'type');

        // Subquery rather than plucking every id into PHP first.
        $ids = $scope()->select('id');

        return [
            'total' => $scope()->count(),
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

        // One transaction so a failure part-way never leaves a half-created
        // invitation behind (which would then make a retry fail on "slug
        // already taken"). story_layout/animation_intensity/envelope come
        // from the type's registry defaults; theme is sent by the client
        // (resolved from the type's defaultThemePreset in themePresets.js,
        // the only place the palette RGB values live).
        $invitation = DB::transaction(function () use ($request, $typeConfig): Invitation {
            $invitation = Invitation::create($request->validated() + [
                'story_layout' => $typeConfig['defaultStoryLayout'] ?? 'constellation',
                'animation_intensity' => $typeConfig['defaultAnimationIntensity'] ?? 'balanced',
            ]);

            $invitation->detail()->create([
                'envelope_animation' => $typeConfig['defaultEnvelopeAnimation'] ?? 'swing-doors',
            ]);

            // Blank names rather than the role label ("Bride", "Groom") so a
            // placeholder never shows up on a public page by accident.
            foreach (array_keys($typeConfig['roles']) as $role) {
                $invitation->people()->create([
                    'role' => $role,
                    'first_name' => '',
                ]);
            }

            return $invitation;
        });

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
        $this->authorizeInvitationEdit($invitation, $request->user());

        $data = $request->validated();

        DB::transaction(function () use ($invitation, $data): void {
            $invitation->update(collect($data)->only([
                'slug', 'is_published', 'meta_title', 'meta_description', 'theme',
                'story_layout', 'animation_intensity', 'owner_id',
            ])->toArray());

            if (! empty($data['detail'])) {
                $invitation->detail()->updateOrCreate([], $this->normalizeDetail($data['detail']));
            }

            if (isset($data['people'])) {
                $invitation->people()->delete();
                $invitation->people()->createMany(array_map(fn (array $person): array => [
                    ...$person,
                    // first_name is NOT NULL; an intentionally blank side
                    // (e.g. a hidden groom) is stored as an empty string.
                    'first_name' => $person['first_name'] ?? '',
                ], $data['people']));
            }
        });

        return new InvitationResource($invitation->fresh(['detail', 'people']));
    }

    public function destroy(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeInvitationEdit($invitation, $request->user());

        $invitation->load(['detail', 'people', 'milestones', 'galleryImages']);
        $paths = InvitationFiles::referencedPaths($invitation);
        $slug = $invitation->slug;

        $invitation->delete();

        InvitationFiles::delete($paths, $slug);

        return response()->json(status: 204);
    }

    /**
     * Columns that are NOT NULL with a DB default: an admin clearing the
     * field (sent as null by ConvertEmptyStringsToNull) falls back to that
     * default instead of tripping a 500 on the insert.
     *
     * @param  array<string, mixed>  $detail
     * @return array<string, mixed>
     */
    private function normalizeDetail(array $detail): array
    {
        $defaults = [
            'connector' => '&',
            'envelope_animation' => 'swing-doors',
            'floating_decor_count' => 14,
            'music_enabled' => false,
            'floating_decor_enabled' => true,
            'show_bride' => true,
            'show_groom' => true,
        ];

        foreach ($defaults as $key => $default) {
            if (array_key_exists($key, $detail) && $detail[$key] === null) {
                $detail[$key] = $default;
            }
        }

        return $detail;
    }
}
