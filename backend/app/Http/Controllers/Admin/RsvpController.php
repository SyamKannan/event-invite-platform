<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RsvpController extends Controller
{
    use AuthorizesInvitationAccess;

    public function index(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        return response()->json(
            $invitation->rsvps()->latest()->get(['id', 'guest_name', 'choice', 'guest_count', 'meal_preference', 'note', 'created_at', 'updated_at'])
        );
    }

    public function export(Request $request, Invitation $invitation): StreamedResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $rsvps = $invitation->rsvps()->latest()->get();

        $filename = "{$invitation->slug}-rsvps.csv";

        return response()->streamDownload(function () use ($rsvps): void {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM so Excel shows non-ASCII names (e.g. Malayalam,
            // Hindi) correctly instead of mojibake.
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, ['Name', 'Choice', 'Guests', 'Meal preference', 'Note', 'Submitted at']);

            foreach ($rsvps as $rsvp) {
                fputcsv($handle, array_map($this->csvSafe(...), [
                    $rsvp->guest_name,
                    $rsvp->choice,
                    $rsvp->guest_count,
                    $rsvp->meal_preference,
                    $rsvp->note,
                    $rsvp->created_at?->toDateTimeString(),
                ]));
            }
            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Owners can remove duplicate, test or spam responses so the headcount
     * stays accurate.
     */
    public function destroy(Request $request, Invitation $invitation, int $rsvp): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $invitation->rsvps()->whereKey($rsvp)->firstOrFail()->delete();

        return response()->json(status: 204);
    }

    /**
     * Guest-typed text is untrusted: a cell starting with = + - @ (or a
     * tab/CR) is run as a formula by Excel/Sheets. Prefixing a quote makes
     * it plain text (OWASP "CSV injection").
     */
    private function csvSafe(mixed $value): mixed
    {
        if (is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }
}
