<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRsvpRequest;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;

class RsvpController extends Controller
{
    public function store(StoreRsvpRequest $request, string $slug): JsonResponse
    {
        $invitation = Invitation::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $rsvp = $invitation->rsvps()->create($request->validated());

        return response()->json(['id' => $rsvp->id], 201);
    }
}
