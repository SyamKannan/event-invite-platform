<?php

namespace App\Support;

use App\Models\GalleryImage;
use App\Models\Invitation;
use App\Models\InvitationDetail;
use App\Models\InvitationPerson;
use App\Models\Milestone;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * Knows where an invitation's uploaded files are referenced from, so they
 * can be cleaned up when the invitation is deleted (or swept up later by
 * `app:prune-orphan-uploads` when an upload was replaced or never saved).
 * Paths are relative keys on the uploads disk; full http(s) URLs point at
 * files we don't own and are ignored.
 */
class InvitationFiles
{
    /**
     * @return list<string>
     */
    public static function referencedPaths(Invitation $invitation): array
    {
        return self::onlyStoredPaths(collect([
            $invitation->detail?->hero_image,
            $invitation->detail?->music_src,
            ...$invitation->people->pluck('photo'),
            ...$invitation->milestones->pluck('image'),
            ...$invitation->galleryImages->pluck('image'),
        ]));
    }

    /**
     * Every uploads-disk path referenced by any invitation.
     *
     * @return list<string>
     */
    public static function allReferencedPaths(): array
    {
        return self::onlyStoredPaths(collect()
            ->merge(InvitationDetail::query()->pluck('hero_image'))
            ->merge(InvitationDetail::query()->pluck('music_src'))
            ->merge(InvitationPerson::query()->pluck('photo'))
            ->merge(Milestone::query()->pluck('image'))
            ->merge(GalleryImage::query()->pluck('image')));
    }

    /**
     * @param  list<string>  $paths
     */
    public static function delete(array $paths, ?string $slug = null): void
    {
        $disk = Storage::disk(config('filesystems.uploads_disk'));

        if ($paths !== []) {
            $disk->delete($paths);
        }

        if ($slug !== null) {
            $disk->deleteDirectory("invitations/{$slug}");
        }
    }

    /**
     * @param  Collection<int, string|null>  $paths
     * @return list<string>
     */
    private static function onlyStoredPaths(Collection $paths): array
    {
        return $paths
            ->filter(fn (?string $path): bool => filled($path) && ! str_starts_with($path, 'http'))
            ->unique()
            ->values()
            ->all();
    }
}
