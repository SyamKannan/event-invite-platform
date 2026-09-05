<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishController extends Controller
{
    use AuthorizesInvitationAccess;

    public function index(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        return response()->json($invitation->wishes()->latest()->get());
    }

    public function destroy(Request $request, Invitation $invitation, int $wish): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $invitation->wishes()->whereKey($wish)->delete();

        return response()->json(status: 204);
    }
}
