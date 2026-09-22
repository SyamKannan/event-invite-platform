<?php

namespace App\Http\Resources;

use App\Support\StoredFileUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Full admin-facing representation of an invitation, including all nested
 * editable resources. Used by the admin dashboard/editor, not the public site.
 *
 * Every stored file path also gets a sibling `*_url` with the resolved,
 * browser-reachable address (local 'public' disk or R2), so the editor can
 * show thumbnails without guessing the storage host itself.
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
            'owner_id' => $this->owner_id,
            'theme' => $this->theme,
            'story_layout' => $this->story_layout,
            'animation_intensity' => $this->animation_intensity,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'detail' => $this->whenLoaded('detail', fn () => $this->detail ? [
                ...$this->detail->toArray(),
                'event_date' => $this->detail->event_date?->toIso8601String(),
                'hero_image_url' => self::url($this->detail->hero_image),
                'music_src_url' => self::url($this->detail->music_src),
            ] : null),
            'people' => $this->whenLoaded('people', fn () => $this->people->map(fn ($p) => [
                ...$p->toArray(),
                'photo_url' => self::url($p->photo),
            ])),
            'schedule_events' => $this->whenLoaded('scheduleEvents'),
            'milestones' => $this->whenLoaded('milestones', fn () => $this->milestones->map(fn ($m) => [
                ...$m->toArray(),
                'image_url' => self::url($m->image),
            ])),
            'gallery_images' => $this->whenLoaded('galleryImages', fn () => $this->galleryImages->map(fn ($g) => [
                ...$g->toArray(),
                'image_url' => self::url($g->image),
            ])),
        ];
    }

    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : StoredFileUrl::for($path);
    }
}
