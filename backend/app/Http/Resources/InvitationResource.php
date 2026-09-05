<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full admin-facing representation of an invitation, including all nested
 * editable resources. Used by the admin dashboard/editor, not the public site.
 */
class InvitationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'type' => $this->type,
            'is_published' => $this->is_published,
            'theme' => $this->theme,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'detail' => $this->whenLoaded('detail'),
            'people' => $this->whenLoaded('people'),
            'schedule_events' => $this->whenLoaded('scheduleEvents'),
            'milestones' => $this->whenLoaded('milestones'),
            'gallery_images' => $this->whenLoaded('galleryImages'),
        ];
    }
}
