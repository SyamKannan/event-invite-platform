<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\AuthorizesInvitationAccess;
use App\Http\Controllers\Controller;
use App\Http\Requests\ReorderGalleryImagesRequest;
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

    public function reorder(ReorderGalleryImagesRequest $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeInvitation($invitation, $request->user());

        $ids = $request->validated('ordered_ids');
        $ownedIds = $invitation->galleryImages()->whereKey($ids)->pluck('id');

        if ($ownedIds->count() !== count($ids)) {
            abort(422, 'One or more gallery images do not belong to this invitation.');
        }

        foreach ($ids as $index => $id) {
            GalleryImage::whereKey($id)->update(['sort_order' => $index]);
        }

        return response()->json(status: 204);
    }
}
