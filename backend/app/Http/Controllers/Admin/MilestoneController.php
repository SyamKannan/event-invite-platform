<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMilestoneRequest;
use App\Models\Invitation;
use App\Models\Milestone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    use AuthorizesInvitationAccess;

    public function store(StoreMilestoneRequest $request, Invitation $invitation): Milestone
    {
        $this->authorizeInvitation($invitation, $request->user());

        return $invitation->milestones()->create($request->validated());
    }

    public function update(StoreMilestoneRequest $request, Invitation $invitation, Milestone $milestone): Milestone
    {
        $this->authorizeInvitation($invitation, $request->user());

        $milestone->update($request->validated());

        return $milestone;
    }

    public function destroy(Request $request, Invitation $invitation, Milestone $milestone): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $milestone->delete();

        return response()->json(status: 204);
    }
}
