<?php

namespace App\Http\Resources;

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

        $bride = $this->people->firstWhere('role', 'bride');
        $groom = $this->people->firstWhere('role', 'groom');
        $celebrant = $this->people->firstWhere('role', 'celebrant');

        $showBride = $detail?->show_bride ?? true;
        $showGroom = $detail?->show_groom ?? true;

        return [
            'slug' => $this->slug,
            'type' => $this->type,
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

            'weddingDateISO' => $detail?->event_date?->toIso8601String(),
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
                'backgroundImage' => $this->photoUrl($detail?->hero_image),
                'overline' => $detail?->hero_overline,
                'tagline' => $detail?->hero_tagline,
            ],

            'story' => [
                'enabled' => $this->milestones->isNotEmpty(),
                'title' => 'Our Journey',
                'subtitle' => 'A few moments along the way',
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
                'enabled' => $this->scheduleEvents->isNotEmpty(),
                'title' => $isWedding ? 'The Celebration' : 'Party Details',
                'subtitle' => $isWedding ? 'Join us across these moments' : 'We would love to see you there',
                'tabs' => $isWedding && $this->scheduleEvents->pluck('team')->filter()->isNotEmpty()
                    ? [
                        ['id' => 'groom', 'label' => 'Groom Side'],
                        ['id' => 'bride', 'label' => 'Bride Side'],
                    ]
                    : null,
                'events' => $this->scheduleEvents->map(fn ($e) => [
                    'id' => (string) $e->id,
                    'team' => $e->team,
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
                'enabled' => true,
                'title' => 'Be Our Guest',
                'message' => $isWedding
                    ? '"Your presence will add an extra touch of joy to our celebration. We would be absolutely honoured to have you stand with us as we say \'I do\'."'
                    : '"Come celebrate with us — your presence is the best gift of all."',
                'acceptLabel' => 'Joyfully Accept',
                'declineLabel' => 'Regretfully Decline',
                'acceptThankyou' => 'We can\'t wait to celebrate with you!',
                'declineThankyou' => 'You\'ll be in our hearts that day.',
            ],

            'gallery' => [
                'enabled' => $this->galleryImages->isNotEmpty(),
                'title' => 'Moments',
                'subtitle' => 'A little glimpse into us',
                'images' => $this->galleryImages->map(fn ($g) => [
                    'src' => $this->photoUrl($g->image),
                    'alt' => $g->alt,
                    'span' => $g->span,
                ])->values(),
            ],

            'guestbook' => [
                'enabled' => true,
                'title' => 'Wishes & Blessings',
                'subtitle' => 'Leave a note we will treasure forever',
            ],

            'music' => [
                'enabled' => (bool) $detail?->music_enabled,
                'src' => $detail?->music_src,
                'title' => 'Background music',
                'autoplay' => false,
            ],

            'theme' => $this->theme,

            'contact' => [
                'bridePhone' => $detail?->contact_phone_primary,
                'groomPhone' => $detail?->contact_phone_secondary,
                'email' => $detail?->contact_email,
                'instagram' => $detail?->contact_instagram,
            ],

            'floatingDecor' => [
                'enabled' => (bool) $detail?->floating_decor_enabled,
                'count' => $detail?->floating_decor_count ?? 14,
                'symbols' => ['❤', '✦', '✿', '❤', '✦'],
            ],
        ];
    }

    private function photoUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return str_starts_with($path, 'http') ? $path : asset('storage/'.$path);
    }
}
