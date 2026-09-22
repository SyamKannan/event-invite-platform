<?php

namespace App\Support;

use App\Models\Invitation;
use Closure;
use Illuminate\Support\Facades\Cache;

/**
 * Read-through cache for the public, anonymous invitation endpoints — the
 * hot path when a link is shared to a big WhatsApp group. Keyed by slug, since
 * that's all the public routes know.
 *
 * Store-agnostic: Redis in production (CACHE_STORE=redis), but it works as-is
 * on the database/array stores local dev and tests use.
 *
 * Invalidation is event-driven (App\Observers\InvitationCacheObserver), with
 * TTL only as a safety net. Query-builder writes skip model events, so any
 * such bulk write must call forget() itself (e.g. the gallery reorder).
 */
class InvitationCache
{
    public const int TTL_SECONDS = 3600;

    /**
     * @param  Closure(): array<string, mixed>  $build
     * @return array<string, mixed>
     */
    public static function config(string $slug, Closure $build): array
    {
        return Cache::remember(self::configKey($slug), self::TTL_SECONDS, $build);
    }

    /**
     * Only the first page is cached — it's what every visitor loads; "Load
     * more" pages are rare and go straight to the database.
     *
     * @param  Closure(): array<int, mixed>  $build
     * @return array<int, mixed>
     */
    public static function wishesFirstPage(string $slug, Closure $build): array
    {
        return Cache::remember(self::wishesKey($slug), self::TTL_SECONDS, $build);
    }

    public static function forget(Invitation|string ...$invitations): void
    {
        foreach ($invitations as $invitation) {
            $slug = $invitation instanceof Invitation ? $invitation->slug : $invitation;

            if (! $slug) {
                continue;
            }

            Cache::forget(self::configKey($slug));
            Cache::forget(self::wishesKey($slug));
        }
    }

    public static function forgetWishes(string $slug): void
    {
        Cache::forget(self::wishesKey($slug));
    }

    private static function configKey(string $slug): string
    {
        return "invitation:{$slug}:config";
    }

    private static function wishesKey(string $slug): string
    {
        return "invitation:{$slug}:wishes";
    }
}
