<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

        // UPLOADS_DISK lets production point uploads at a durable disk (e.g.
        // Cloudflare R2 via the 'r2' disk) instead of the container's local
        // disk, which Railway wipes on every deploy. Local dev leaves this
        // unset and keeps using 'public' as before.
        $disk = config('filesystems.uploads_disk', 'public');
        $path = $request->file('file')->store("invitations/{$invitation->slug}/{$type}s", $disk);

        // The 'public' disk's url() reads APP_URL directly, which on Railway
        // resolves to an unreachable *.railway.internal hostname rather than
        // the real public domain — asset() correctly reflects the actual
        // inbound request host instead. Only a real remote disk like R2
        // needs Storage::url(), since its URL is a fixed public address.
        $url = $disk === 'public' ? asset('storage/'.$path) : Storage::disk($disk)->url($path);

        return response()->json([
            'path' => $path,
            'url' => $url,
        ], 201);
    }
}
