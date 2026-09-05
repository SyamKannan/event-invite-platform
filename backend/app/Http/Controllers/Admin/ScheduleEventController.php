<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScheduleEventRequest;
use App\Models\Invitation;
use App\Models\ScheduleEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleEventController extends Controller
{
    use AuthorizesInvitationAccess;

    public function store(StoreScheduleEventRequest $request, Invitation $invitation): ScheduleEvent
    {
        $this->authorizeInvitation($invitation, $request->user());

        return $invitation->scheduleEvents()->create($request->validated());
    }

    public function update(StoreScheduleEventRequest $request, Invitation $invitation, ScheduleEvent $scheduleEvent): ScheduleEvent
    {
        $this->authorizeInvitation($invitation, $request->user());

        $scheduleEvent->update($request->validated());

        return $scheduleEvent;
    }

    public function destroy(Request $request, Invitation $invitation, ScheduleEvent $scheduleEvent): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $scheduleEvent->delete();

        return response()->json(status: 204);
    }
}
