<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\InvitationDetail;
use App\Support\EventTypes;
use App\Support\StoredFileUrl;
use Illuminate\View\View;

/**
 * Renders a server-side HTML page with static Open Graph / Twitter Card meta
 * tags for one invitation, then bounces real browsers on to the React SPA.
 *
 * Link-preview crawlers (WhatsApp, Facebook, Telegram, iMessage, ...) fetch a
 * shared URL and read <meta> tags straight out of the HTML response — they do
 * not execute JavaScript. Since the SPA only sets document.title/description
 * client-side (see ThemeProvider.jsx), a raw /i/{slug} link previews with
 * nothing but index.html's generic title. This route is what a "Share to
 * WhatsApp" button links to instead: crawlers see real content, humans get
 * redirected straight through to the live invitation.
 */
class ShareController extends Controller
{
    public function show(string $slug): View
    {
        $invitation = Invitation::query()
            ->where('slug', $slug)
            ->where('is_published', true)
            ->with(['detail', 'people', 'galleryImages'])
            ->firstOrFail();

        $detail = $invitation->detail;
        $isWedding = $invitation->type === 'wedding';

        $title = $invitation->meta_title ?: $this->defaultTitle($invitation, $isWedding);
        $description = $invitation->meta_description ?: $this->defaultDescription($detail, $isWedding, $invitation->type);
        $image = $this->resolveImage($invitation, $detail);
        // The first FRONTEND_URLS entry is the canonical public site.
        $frontendUrl = rtrim(config('cors.allowed_origins')[0] ?? 'http://localhost:5174', '/');

        // The stored slug, not the raw URL segment — MySQL's collation
        // matches case-insensitively, so /share/Foo would otherwise redirect
        // to a differently-cased URL than the canonical one.
        return view('share', [
            'title' => $title,
            'description' => $description,
            'image' => $image,
            'redirectUrl' => "{$frontendUrl}/i/{$invitation->slug}",
            'shareUrl' => url("/share/{$invitation->slug}"),
        ]);
    }

    private function defaultTitle(Invitation $invitation, bool $isWedding): string
    {
        if ($isWedding) {
            $bride = $invitation->people->firstWhere('role', 'bride');
            $groom = $invitation->people->firstWhere('role', 'groom');
            $names = array_filter([$bride?->first_name, $groom?->first_name]);

            return $names ? implode(' & ', $names).' are getting married!' : "You're invited!";
        }

        if ($invitation->type === 'birthday') {
            $celebrant = $invitation->people->firstWhere('role', 'celebrant');

            return $celebrant?->first_name ? "It's {$celebrant->first_name}'s birthday!" : "You're invited!";
        }

        return "You're invited!";
    }

    private function defaultDescription(?InvitationDetail $detail, bool $isWedding, string $type): string
    {
        $when = $detail?->display_date;
        $where = $detail?->display_location;

        if ($when && $where) {
            return "Join us on {$when} at {$where}.";
        }

        if ($isWedding) {
            return 'Join us as we celebrate our wedding.';
        }

        if ($type === 'birthday') {
            return "You're invited to celebrate with us.";
        }

        return "You're invited — {$this->label($type)}.";
    }

    private function label(string $type): string
    {
        return EventTypes::ALL[$type]['label'] ?? "You're invited";
    }

    private function resolveImage(Invitation $invitation, ?InvitationDetail $detail): ?string
    {
        $path = $detail?->hero_image ?? $invitation->galleryImages->first()?->image;

        if (! $path) {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : StoredFileUrl::for($path);
    }
}
