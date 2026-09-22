<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWishRequest;
use App\Models\Invitation;
use App\Support\InvitationCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishController extends Controller
{
    /**
     * Newest first, in pages of PAGE_SIZE. `?before={id}` returns the page
     * after that wish ("Load more"), so the guestbook isn't capped at the
     * latest 100 forever.
     */
    public const int PAGE_SIZE = 30;

    public function index(Request $request, string $slug): JsonResponse
    {
        $before = $request->integer('before');

        if ($before <= 0) {
            return response()->json(
                InvitationCache::wishesFirstPage($slug, fn (): array => $this->page($slug, 0))
            );
        }

        return response()->json($this->page($slug, $before));
    }

    public function store(StoreWishRequest $request, string $slug): JsonResponse
    {
        $invitation = $this->publishedInvitation($slug);

        $wish = $invitation->wishes()->create($request->safe()->only(['name', 'message']));

        return response()->json($wish->only(['id', 'name', 'message', 'created_at']), 201);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function page(string $slug, int $before): array
    {
        return $this->publishedInvitation($slug)->wishes()
            ->when($before > 0, fn ($q) => $q->where('id', '<', $before))
            ->orderByDesc('id')
            ->limit(self::PAGE_SIZE)
            ->get(['id', 'name', 'message', 'created_at'])
            ->toArray();
    }

    private function publishedInvitation(string $slug): Invitation
    {
        return Invitation::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();
    }
}
