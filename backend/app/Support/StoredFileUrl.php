<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Resolves a public, browser-reachable URL for a file stored on the
 * configured uploads disk (see config/filesystems.php's 'uploads_disk').
 *
 * The 'public' disk's own Storage::url() reads APP_URL directly rather than
 * the current request's actual host. On Railway, APP_URL resolves to the
 * *.railway.internal hostname (Railway's private service-to-service
 * network), which is unreachable from any browser. asset() instead reflects
 * the real inbound request host, correctly, once Laravel trusts Railway's
 * proxy (see bootstrap/app.php's trustProxies call) — so the 'public' disk
 * is special-cased to use it. A real remote disk (e.g. 'r2') already has a
 * fixed public address unrelated to any particular request, so it uses
 * Storage::url() as normal.
 */
class StoredFileUrl
{
    public static function for(string $path, ?string $disk = null): string
    {
        $disk ??= config('filesystems.uploads_disk', 'public');

        if ($disk === 'public') {
            return asset('storage/'.$path);
        }

        return Storage::disk($disk)->url($path);
    }
}
