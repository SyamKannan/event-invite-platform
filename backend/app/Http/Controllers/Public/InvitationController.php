<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvitationConfigResource;
use App\Models\Invitation;
use App\Support\InvitationCache;
use Illuminate\Http\JsonResponse;

class InvitationController extends Controller
{
    /**
     * Cached as the fully-resolved JSON payload (same `{data: ...}` envelope
     * the resource produced), so a cache hit costs zero queries. Unpublished
     * or unknown slugs 404 inside the closure and are never cached.
     */
    public function show(string $slug): JsonResponse
    {
        $payload = InvitationCache::config($slug, function () use ($slug): array {
            $invitation = Invitation::query()
                ->where('slug', $slug)
                ->where('is_published', true)
                ->with(['detail', 'people', 'scheduleEvents', 'milestones', 'galleryImages'])
                ->firstOrFail();

            return (new InvitationConfigResource($invitation))->response()->getData(true);
        });

        return response()->json($payload);
    }
}
