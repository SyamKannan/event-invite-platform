<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePersonRequest;
use App\Models\Invitation;
use App\Models\InvitationPerson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PersonController extends Controller
{
    use AuthorizesInvitationAccess;

    public function store(StorePersonRequest $request, Invitation $invitation): InvitationPerson
    {
        $this->authorizeInvitation($invitation, $request->user());

        return $invitation->people()->create($request->validated());
    }

    public function update(StorePersonRequest $request, Invitation $invitation, InvitationPerson $person): InvitationPerson
    {
        $this->authorizeInvitation($invitation, $request->user());

        $person->update($request->validated());

        return $person;
    }

    public function destroy(Request $request, Invitation $invitation, InvitationPerson $person): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $person->delete();

        return response()->json(status: 204);
    }
}
