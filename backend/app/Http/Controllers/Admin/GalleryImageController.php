<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGalleryImageRequest;
use App\Models\GalleryImage;
use App\Models\Invitation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GalleryImageController extends Controller
{
    use AuthorizesInvitationAccess;

    public function store(StoreGalleryImageRequest $request, Invitation $invitation): GalleryImage
    {
        $this->authorizeInvitation($invitation, $request->user());

        return $invitation->galleryImages()->create($request->validated());
    }

    public function update(StoreGalleryImageRequest $request, Invitation $invitation, GalleryImage $galleryImage): GalleryImage
    {
        $this->authorizeInvitation($invitation, $request->user());

        $galleryImage = $invitation->galleryImages()->findOrFail($galleryImage->id);
        $galleryImage->update($request->validated());

        return $galleryImage;
    }

    public function destroy(Request $request, Invitation $invitation, GalleryImage $galleryImage): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $invitation->galleryImages()->whereKey($galleryImage->id)->firstOrFail()->delete();

        return response()->json(status: 204);
    }
}
