<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    use AuthorizesInvitationAccess;

    public function store(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $request->validate([
            'type' => ['sometimes', 'in:image,audio'],
        ]);

        $type = $request->input('type', 'image');

        $request->validate([
            'file' => $type === 'audio'
                ? ['required', 'file', 'mimes:mp3,wav,ogg,m4a', 'max:15360']
                : ['required', 'image', 'max:8192'],
        ]);

        $path = $request->file('file')->store("invitations/{$invitation->slug}/{$type}s", 'public');

        return response()->json([
            'path' => $path,
            'url' => asset('storage/'.$path),
        ], 201);
    }
}
