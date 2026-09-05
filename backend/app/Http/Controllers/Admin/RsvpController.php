<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RsvpController extends Controller
{
    use AuthorizesInvitationAccess;

    public function index(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        return response()->json($invitation->rsvps()->latest()->get());
    }

    public function export(Request $request, Invitation $invitation): StreamedResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $rsvps = $invitation->rsvps()->latest()->get();

        $filename = "{$invitation->slug}-rsvps.csv";

        return response()->streamDownload(function () use ($rsvps): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Name', 'Choice', 'Guests', 'Meal preference', 'Note', 'Submitted at']);

            /** @var Collection $rsvps */
            foreach ($rsvps as $rsvp) {
                fputcsv($handle, [
                    $rsvp->guest_name,
                    $rsvp->choice,
                    $rsvp->guest_count,
                    $rsvp->meal_preference,
                    $rsvp->note,
                    $rsvp->created_at?->toDateTimeString(),
                ]);
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }
}
