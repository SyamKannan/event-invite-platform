<?php

namespace App\Http\Resources;

use App\Support\EventTypes;
use App\Support\StoredFileUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shapes an Invitation (with its relations eager-loaded) into the same JSON
 * structure the frontend's static wedding.config.js used to export. Every
 * React section reads this shape via ConfigContext, so keys here must match
 * what Hero.jsx, Schedule.jsx, Gallery.jsx, etc. expect.
 */
class InvitationConfigResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $detail = $this->detail;
        $isWedding = $this->type === 'wedding';
        $typeConfig = EventTypes::ALL[$this->type] ?? EventTypes::ALL['wedding'];
        $modules = $typeConfig['modules'];
        $copy = $typeConfig['copy'];

        $bride = $this->people->firstWhere('role', 'bride');
        $groom = $this->people->firstWhere('role', 'groom');
        $celebrant = $this->people->firstWhere('role', 'celebrant');

        $eventDateIso = $detail?->event_date?->toIso8601String();

        $showBride = $detail?->show_bride ?? true;
        $showGroom = $detail?->show_groom ?? true;

        // Generic role => {firstName, parents, photo} map, populated for
        // every type (including wedding/birthday) so new-type frontend
        // components can read people.* without needing couple/celebrant's
        // hardcoded shape. Additive only — couple/celebrant below are
        // unchanged for wedding/birthday.
        $people = collect($typeConfig['roles'])->keys()->mapWithKeys(function ($role) {
            $person = $this->people->firstWhere('role', $role);

            return [$role => [
                'firstName' => $person?->first_name,
                'parents' => $person?->parents_text,
                'photo' => $this->photoUrl($person?->photo),
            ]];
        })->all();

        return [
            'slug' => $this->slug,
            'type' => $this->type,
            'modules' => $modules,
            'storyLayout' => $this->story_layout ?? 'constellation',
            'animationIntensity' => $this->animation_intensity ?? 'balanced',

            'meta' => [
                'title' => $this->meta_title,
                'description' => $this->meta_description,
            ],

            'couple' => $isWedding ? [
                'bride' => $showBride ? [
                    'firstName' => $bride?->first_name,
                    'parents' => $bride?->parents_text,
                    'photo' => $this->photoUrl($bride?->photo),
                ] : null,
                'groom' => $showGroom ? [
                    'firstName' => $groom?->first_name,
                    'parents' => $groom?->parents_text,
                    'photo' => $this->photoUrl($groom?->photo),
                ] : null,
                'connector' => $detail?->connector ?? '&',
            ] : null,

            'celebrant' => ! $isWedding ? [
                'firstName' => $celebrant?->first_name,
                'photo' => $this->photoUrl($celebrant?->photo),
                'age' => $detail?->celebrant_age,
                'turningText' => $detail?->celebrant_turning_text,
            ] : null,

            'people' => $people,

            // event_date is stored in UTC (the admin editor converts the
            // admin's local datetime-local value before saving), so this is
            // an unambiguous instant. weddingDateISO is the legacy name, kept
            // for back-compat with anything still reading it.
            'eventDateISO' => $eventDateIso,
            'weddingDateISO' => $eventDateIso,
            'display' => [
                'date' => $detail?->display_date,
                'time' => $detail?->display_time,
                'location' => $detail?->display_location,
            ],

            'envelope' => [
                'enabled' => true,
                'overline' => $detail?->envelope_overline,
                'cta' => $detail?->envelope_cta,
                'animation' => $detail?->envelope_animation ?? 'swing-doors',
            ],

            'hero' => [
                'enabled' => in_array('hero', $modules, true),
                'backgroundImage' => $this->photoUrl($detail?->hero_image),
                'overline' => $detail?->hero_overline,
                'tagline' => $detail?->hero_tagline,
                'dateRevealLabel' => $copy['hero.dateRevealLabel'] ?? 'Date reveal',
            ],

            // Without an event date there's nothing to count down to (the
            // frontend would otherwise treat null as 1970 and announce
            // "Today is the day!").
            'countdown' => [
                'enabled' => in_array('countdown', $modules, true) && $eventDateIso !== null,
                'subtitle' => $copy['countdown.subtitle'] ?? 'counting down to the big day',
                'eventLabel' => $copy['countdown.eventLabel'] ?? 'The big day',
                'todayMessage' => $copy['countdown.todayMessage'] ?? 'Today is the day! Thank you for celebrating with us.',
                'pastMessage' => $copy['countdown.pastMessage'] ?? 'Thank you for celebrating with us.',
            ],

            'story' => [
                'enabled' => in_array('story', $modules, true) && $this->milestones->isNotEmpty(),
                'title' => $copy['story.title'] ?? 'Our Journey',
                'subtitle' => $copy['story.subtitle'] ?? 'A few moments along the way',
                'milestones' => $this->milestones->map(fn ($m) => [
                    'x' => $m->x,
                    'y' => $m->y,
                    'date' => $m->date_label,
                    'title' => $m->title,
                    'description' => $m->description,
                    'image' => $this->photoUrl($m->image),
                ])->values(),
            ],

            'schedule' => [
                'enabled' => in_array('schedule', $modules, true) && $this->scheduleEvents->isNotEmpty(),
                'title' => $copy['schedule.title'] ?? 'The Celebration',
                'subtitle' => $copy['schedule.subtitle'] ?? 'Join us across these moments',
                // Only show a side's tab when at least one event is actually
                // assigned to it — a lone Groom-side event shouldn't produce
                // a Bride Side tab that just leads to an empty list.
                'tabs' => $isWedding
                    ? collect([
                        ['id' => 'groom', 'label' => 'Groom Side'],
                        ['id' => 'bride', 'label' => 'Bride Side'],
                    ])->filter(fn ($tab) => $this->scheduleEvents->contains(
                        fn ($e) => $e->team && strtolower($e->team) === $tab['id']
                    ))->values()->all() ?: null
                    : null,
                'events' => $this->scheduleEvents->map(fn ($e) => [
                    'id' => (string) $e->id,
                    // Lowercased to match the 'groom'/'bride' tab ids above —
                    // the admin's "Team" field is free text, so an admin
                    // typing "Groom" (capitalized) would otherwise never
                    // match the tab and the event would silently vanish.
                    'team' => $e->team ? strtolower($e->team) : null,
                    'title' => $e->title,
                    'date' => $e->event_date->toDateString(),
                    'time' => $e->event_time,
                    'venue' => $e->venue,
                    'address' => $e->address,
                    'mapUrl' => $e->map_url,
                    'dresscode' => $e->dresscode,
                ])->values(),
            ],

            'rsvp' => [
                'enabled' => in_array('rsvp', $modules, true),
                'title' => $copy['rsvp.title'] ?? 'Be Our Guest',
                'message' => $copy['rsvp.message'] ?? '"Come celebrate with us — your presence is the best gift of all."',
                'acceptLabel' => $copy['rsvp.acceptLabel'] ?? 'Joyfully Accept',
                'declineLabel' => $copy['rsvp.declineLabel'] ?? 'Regretfully Decline',
                'acceptThankyou' => $copy['rsvp.acceptThankyou'] ?? 'We can\'t wait to celebrate with you!',
                'declineThankyou' => $copy['rsvp.declineThankyou'] ?? 'You\'ll be in our hearts that day.',
                'mealOptions' => $typeConfig['mealOptions'] ?? EventTypes::DEFAULT_MEAL_OPTIONS,
            ],

            'gallery' => [
                'enabled' => in_array('gallery', $modules, true) && $this->galleryImages->isNotEmpty(),
                'title' => $copy['gallery.title'] ?? 'Moments',
                'subtitle' => $copy['gallery.subtitle'] ?? 'A little glimpse into us',
                'images' => $this->galleryImages->map(fn ($g) => [
                    'src' => $this->photoUrl($g->image),
                    'alt' => $g->alt,
                    'span' => $g->span,
                ])->values(),
            ],

            'guestbook' => [
                'enabled' => in_array('guestbook', $modules, true),
                'title' => $copy['guestbook.title'] ?? 'Wishes & Blessings',
                'subtitle' => $copy['guestbook.subtitle'] ?? 'Leave a note we will treasure forever',
            ],

            'music' => [
                'enabled' => (bool) $detail?->music_enabled,
                'src' => $this->photoUrl($detail?->music_src),
                'title' => 'Background music',
                'autoplay' => false,
            ],

            'theme' => $this->theme,
            'extra' => $detail?->extra ?? [],

            // phonePrimary/phoneSecondary are the type-neutral names;
            // bridePhone/groomPhone are legacy aliases of the same values.
            'contact' => [
                'phonePrimary' => $detail?->contact_phone_primary,
                'phoneSecondary' => $detail?->contact_phone_secondary,
                'bridePhone' => $detail?->contact_phone_primary,
                'groomPhone' => $detail?->contact_phone_secondary,
                'email' => $detail?->contact_email,
                'instagram' => $detail?->contact_instagram,
            ],

            'floatingDecor' => [
                'enabled' => (bool) $detail?->floating_decor_enabled,
                'count' => $detail?->floating_decor_count ?? 14,
                'symbols' => $typeConfig['decorSymbols'] ?? EventTypes::DEFAULT_DECOR_SYMBOLS,
            ],
        ];
    }

    private function photoUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http')) {
            return $path;
        }

        return StoredFileUrl::for($path);
    }
}
