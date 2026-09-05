<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWishRequest;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;

class WishController extends Controller
{
    public function index(string $slug): JsonResponse
    {
        $invitation = Invitation::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $wishes = $invitation->wishes()
            ->latest()
            ->limit(100)
            ->get(['id', 'name', 'message', 'created_at']);

        return response()->json($wishes);
    }

    public function store(StoreWishRequest $request, string $slug): JsonResponse
    {
        $invitation = Invitation::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $wish = $invitation->wishes()->create($request->validated());

        return response()->json($wish, 201);
    }
}
