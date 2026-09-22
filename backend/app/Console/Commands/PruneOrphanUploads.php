<?php

namespace App\Console\Commands;

use App\Support\InvitationFiles;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Deletes uploaded files no invitation references any more — photos that
 * were replaced, uploads the admin never saved, leftovers from renamed
 * slugs. Only files older than --min-age hours are touched, so an upload
 * sitting in an admin's unsaved form right now is never removed.
 */
#[Signature('app:prune-orphan-uploads {--dry-run : List what would be deleted without deleting} {--min-age=24 : Only delete files older than this many hours} {--force : Delete even when the database references no files at all}')]
#[Description('Delete uploaded invitation files that are no longer referenced by any invitation')]
class PruneOrphanUploads extends Command
{
    public function handle(): int
    {
        $disk = Storage::disk(config('filesystems.uploads_disk'));
        $referenced = array_flip(InvitationFiles::allReferencedPaths());
        $cutoff = now()->subHours((int) $this->option('min-age'))->getTimestamp();
        $dryRun = (bool) $this->option('dry-run');

        $files = collect($disk->allFiles('invitations'));

        // Safety net: if the database references nothing at all but files
        // exist, this is almost certainly the wrong database (a fresh or
        // test DB pointed at real storage) — refuse rather than wipe
        // everything.
        if ($referenced === [] && $files->isNotEmpty() && ! $this->option('force')) {
            $this->error("No invitation references any uploaded file, yet {$files->count()} file(s) exist. Is this the right database? Re-run with --force to delete them anyway.");

            return self::FAILURE;
        }

        $orphans = $files
            ->reject(fn (string $path): bool => isset($referenced[$path]))
            ->filter(fn (string $path): bool => $disk->lastModified($path) < $cutoff)
            ->values();

        foreach ($orphans as $path) {
            $this->line(($dryRun ? 'Would delete: ' : 'Deleting: ').$path);
        }

        if (! $dryRun && $orphans->isNotEmpty()) {
            $disk->delete($orphans->all());
        }

        $this->info(($dryRun ? 'Would delete ' : 'Deleted ').$orphans->count().' orphaned file(s).');

        return self::SUCCESS;
    }
}
