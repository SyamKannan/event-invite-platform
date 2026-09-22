<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRsvpRequest;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class RsvpController extends Controller
{
    /**
     * Creates an RSVP, or — when the request carries the id + edit_token
     * returned by an earlier submission from the same device — updates that
     * one instead, so a guest changing their mind doesn't double-count.
     * The token is random and only ever returned to the submitting browser.
     */
    public function store(StoreRsvpRequest $request, string $slug): JsonResponse
    {
        $invitation = Invitation::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $fields = $request->safe()->only(['guest_name', 'choice', 'guest_count', 'meal_preference', 'note']);
        $fields['guest_count'] ??= 1;

        $existing = $request->filled('rsvp_id')
            ? $invitation->rsvps()
                ->whereKey($request->integer('rsvp_id'))
                ->where('edit_token', (string) $request->input('edit_token'))
                ->first()
            : null;

        if ($existing) {
            $existing->update($fields);

            return response()->json(['id' => $existing->id, 'edit_token' => $existing->edit_token]);
        }

        $rsvp = $invitation->rsvps()->create([...$fields, 'edit_token' => Str::random(40)]);

        return response()->json(['id' => $rsvp->id, 'edit_token' => $rsvp->edit_token], 201);
    }
}
