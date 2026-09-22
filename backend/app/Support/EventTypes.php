<?php

namespace App\Support;

/**
 * Single source of truth for every event type the platform supports: which
 * content modules it renders, which "people" roles it collects, its default
 * theme/story layout/opening animation/motion intensity, and the copy
 * strings InvitationConfigResource used to hardcode per-type. Exposed to the
 * frontend via GET /api/event-types so Dashboard.jsx, ClientDashboard.jsx
 * and InvitationEditor.jsx never hand duplicate this list. Adding a new type
 * is a new array entry here — no migration required.
 *
 * wedding/birthday's 'copy' values are the exact strings
 * InvitationConfigResource hardcoded before this registry existed, so
 * behavior for those two types is unchanged.
 *
 * The four `default*` keys exist so every event type opens looking and
 * feeling distinct out of the box — Admin\InvitationController::store()
 * seeds story_layout/animation_intensity/envelope_animation straight from
 * here (all plain enum strings, safe to resolve server-side), while
 * defaultThemePreset is resolved client-side against
 * frontend/src/admin/themePresets.js's THEME_PRESETS (the actual RGB values
 * intentionally live only there, not duplicated on the backend). Each
 * assignment below was picked to fit the occasion, not just to avoid a
 * collision — e.g. house_warming opens with 'swing-doors' (literally opening
 * a front door) and business_opening with 'rising-curtain' (a grand-opening
 * curtain raise). defaultStoryLayout must be one of that type's own
 * storyLayouts list (or omitted for a type with none).
 *
 * @see EnvelopeAnimations::ALL for the full opening-animation catalogue.
 */
class EventTypes
{
    /**
     * @var array<string, array{
     *     label: string,
     *     icon: string,
     *     modules: list<string>,
     *     roles: array<string, string>,
     *     defaultThemePreset: string,
     *     defaultEnvelopeAnimation: string,
     *     defaultStoryLayout?: string,
     *     defaultAnimationIntensity: string,
     *     storyLayouts: list<string>,
     *     copy: array<string, string>,
     * }>
     */
    public const array ALL = [
        'wedding' => [
            'label' => 'Wedding',
            'icon' => 'heart',
            'modules' => ['hero', 'countdown', 'story', 'schedule', 'rsvp', 'gallery', 'guestbook'],
            'roles' => ['bride' => 'Bride', 'groom' => 'Groom'],
            'defaultThemePreset' => 'classic-romance',
            'defaultEnvelopeAnimation' => 'petal-bloom',
            'defaultStoryLayout' => 'constellation',
            'defaultAnimationIntensity' => 'balanced',
            'storyLayouts' => ['constellation', 'timeline', 'horizontal', 'stacked', 'mosaic'],
            'copy' => [
                'story.title' => 'Our Journey',
                'story.subtitle' => 'A few moments along the way',
                'schedule.title' => 'The Celebration',
                'schedule.subtitle' => 'Join us across these moments',
                'rsvp.title' => 'Be Our Guest',
                'rsvp.message' => '"Your presence will add an extra touch of joy to our celebration. We would be absolutely honoured to have you stand with us as we say \'I do\'."',
                'rsvp.acceptLabel' => 'Joyfully Accept',
                'rsvp.declineLabel' => 'Regretfully Decline',
                'rsvp.acceptThankyou' => 'We can\'t wait to celebrate with you!',
                'rsvp.declineThankyou' => 'You\'ll be in our hearts that day.',
                'gallery.title' => 'Moments',
                'gallery.subtitle' => 'A little glimpse into us',
                'guestbook.title' => 'Wishes & Blessings',
                'guestbook.subtitle' => 'Leave a note we will treasure forever',
            ],
        ],

        'birthday' => [
            'label' => 'Birthday',
            'icon' => 'cake',
            'modules' => ['hero', 'countdown', 'story', 'schedule', 'rsvp', 'gallery', 'guestbook'],
            'roles' => ['celebrant' => 'Celebrant'],
            'defaultThemePreset' => 'blush-rose',
            'defaultEnvelopeAnimation' => 'confetti-pop',
            'defaultStoryLayout' => 'horizontal',
            'defaultAnimationIntensity' => 'playful',
            'storyLayouts' => ['constellation', 'timeline', 'horizontal', 'stacked', 'mosaic'],
            'copy' => [
                'story.title' => 'Our Journey',
                'story.subtitle' => 'A few moments along the way',
                'schedule.title' => 'Party Details',
                'schedule.subtitle' => 'We would love to see you there',
                'rsvp.title' => 'Be Our Guest',
                'rsvp.message' => '"Come celebrate with us — your presence is the best gift of all."',
                'rsvp.acceptLabel' => 'Joyfully Accept',
                'rsvp.declineLabel' => 'Regretfully Decline',
                'rsvp.acceptThankyou' => 'We can\'t wait to celebrate with you!',
                'rsvp.declineThankyou' => 'You\'ll be in our hearts that day.',
                'gallery.title' => 'Moments',
                'gallery.subtitle' => 'A little glimpse into us',
                'guestbook.title' => 'Wishes & Blessings',
                'guestbook.subtitle' => 'Leave a note we will treasure forever',
            ],
        ],

        'baby_naming' => [
            'label' => 'Baby Naming Ceremony',
            'icon' => 'baby',
            'modules' => ['hero', 'story', 'rsvp', 'gallery', 'guestbook'],
            'roles' => ['baby' => 'Baby'],
            'defaultThemePreset' => 'lavender-dusk',
            'defaultEnvelopeAnimation' => 'fade-glow',
            'defaultStoryLayout' => 'mosaic',
            'defaultAnimationIntensity' => 'subtle',
            'storyLayouts' => ['timeline', 'stacked', 'mosaic'],
            'copy' => [
                'story.title' => "Baby's First Moments",
                'story.subtitle' => 'Every little milestone so far',
                'rsvp.title' => 'Join the Celebration',
                'rsvp.message' => '"We would be delighted to have you celebrate this special naming ceremony with us."',
                'rsvp.acceptLabel' => 'We\'ll Be There',
                'rsvp.declineLabel' => 'Can\'t Make It',
                'rsvp.acceptThankyou' => 'We can\'t wait to celebrate with you!',
                'rsvp.declineThankyou' => 'You\'ll be thought of on the day.',
                'gallery.title' => 'Precious Moments',
                'gallery.subtitle' => 'A few photos to treasure',
                'guestbook.title' => 'Blessings for Baby',
                'guestbook.subtitle' => 'Leave a wish for the little one',
            ],
        ],

        'visiting_card' => [
            'label' => 'Digital Visiting Card',
            'icon' => 'contact',
            'modules' => ['hero', 'contact'],
            'roles' => ['owner' => 'Owner'],
            'defaultThemePreset' => 'midnight-blue',
            'defaultEnvelopeAnimation' => 'slide-reveal',
            'defaultAnimationIntensity' => 'subtle',
            'storyLayouts' => [],
            'copy' => [],
        ],

        'business_opening' => [
            'label' => 'Small Business Grand Opening',
            'icon' => 'store',
            'modules' => ['hero', 'countdown', 'schedule', 'gallery', 'contact'],
            'roles' => ['owner' => 'Owner'],
            'defaultThemePreset' => 'sunset-coral',
            'defaultEnvelopeAnimation' => 'rising-curtain',
            'defaultAnimationIntensity' => 'playful',
            'storyLayouts' => [],
            'copy' => [
                'schedule.title' => 'Opening Day Schedule',
                'schedule.subtitle' => 'Here\'s what to expect',
                'gallery.title' => 'A Look Inside',
                'gallery.subtitle' => 'See what we\'ve been building',
            ],
        ],

        'house_warming' => [
            'label' => 'House Warming',
            'icon' => 'home',
            'modules' => ['hero', 'countdown', 'story', 'schedule', 'rsvp', 'gallery', 'guestbook'],
            'roles' => ['host' => 'Host'],
            'defaultThemePreset' => 'autumn-maple',
            'defaultEnvelopeAnimation' => 'swing-doors',
            'defaultStoryLayout' => 'timeline',
            'defaultAnimationIntensity' => 'balanced',
            'storyLayouts' => ['timeline', 'stacked', 'mosaic'],
            'copy' => [
                'story.title' => 'Our Journey to This Home',
                'story.subtitle' => 'How we got here',
                'schedule.title' => 'Griha Pravesh Details',
                'schedule.subtitle' => 'Join us as we open our doors',
                'rsvp.title' => 'Join Us at Home',
                'rsvp.message' => '"Come bless our new home with your presence."',
                'rsvp.acceptLabel' => 'We\'ll Be There',
                'rsvp.declineLabel' => 'Can\'t Make It',
                'rsvp.acceptThankyou' => 'We can\'t wait to welcome you home!',
                'rsvp.declineThankyou' => 'You\'ll be thought of on the day.',
                'gallery.title' => 'Our New Home',
                'gallery.subtitle' => 'A little glimpse inside',
                'guestbook.title' => 'Blessings for Our Home',
                'guestbook.subtitle' => 'Leave a note we will treasure forever',
            ],
        ],

        'anniversary' => [
            'label' => 'Anniversary',
            'icon' => 'gem',
            'modules' => ['hero', 'countdown', 'story', 'gallery', 'guestbook'],
            'roles' => ['celebrant1' => 'Celebrant 1', 'celebrant2' => 'Celebrant 2'],
            'defaultThemePreset' => 'ivory-champagne',
            'defaultEnvelopeAnimation' => 'wax-seal',
            'defaultStoryLayout' => 'stacked',
            'defaultAnimationIntensity' => 'subtle',
            'storyLayouts' => ['timeline', 'constellation', 'stacked'],
            'copy' => [
                'story.title' => 'Years Together',
                'story.subtitle' => 'A journey worth celebrating',
                'gallery.title' => 'Memories',
                'gallery.subtitle' => 'A look back through the years',
                'guestbook.title' => 'Wishes & Blessings',
                'guestbook.subtitle' => 'Leave a note for us to treasure',
            ],
        ],

        'reunion' => [
            'label' => 'Reunion',
            'icon' => 'users',
            'modules' => ['hero', 'countdown', 'schedule', 'gallery', 'guestbook'],
            'roles' => [],
            'defaultThemePreset' => 'golden-sand',
            'defaultEnvelopeAnimation' => 'flip-book',
            'defaultAnimationIntensity' => 'balanced',
            'storyLayouts' => [],
            'copy' => [
                'schedule.title' => 'Reunion Details',
                'schedule.subtitle' => 'Where and when to find us',
                'gallery.title' => 'Then & Now',
                'gallery.subtitle' => 'Old memories, new moments',
                'guestbook.title' => 'Memory Wall',
                'guestbook.subtitle' => 'Share a story or a shoutout',
            ],
        ],

        'religious' => [
            'label' => 'Religious / Festival Event',
            'icon' => 'sparkles',
            'modules' => ['hero', 'schedule', 'gallery', 'guestbook', 'rsvp'],
            'roles' => ['organizer' => 'Organizer'],
            'defaultThemePreset' => 'ocean-teal',
            'defaultEnvelopeAnimation' => 'iris-open',
            'defaultAnimationIntensity' => 'subtle',
            'storyLayouts' => [],
            'copy' => [
                'schedule.title' => 'Event Schedule',
                'schedule.subtitle' => 'Join us for these moments',
                'rsvp.title' => 'Volunteer Sign-Up',
                'rsvp.message' => '"Lend a hand and be part of making this event happen."',
                'rsvp.acceptLabel' => 'Count Me In',
                'rsvp.declineLabel' => 'Not This Time',
                'rsvp.acceptThankyou' => 'Thank you for volunteering!',
                'rsvp.declineThankyou' => 'Thank you for letting us know.',
                'gallery.title' => 'Gallery',
                'gallery.subtitle' => 'Moments from our community',
                'guestbook.title' => 'Announcements',
                'guestbook.subtitle' => 'Leave a note for the community',
            ],
        ],

        'retirement' => [
            'label' => 'Retirement',
            'icon' => 'award',
            'modules' => ['hero', 'countdown', 'story', 'schedule', 'gallery', 'guestbook'],
            'roles' => ['honoree' => 'Honoree'],
            'defaultThemePreset' => 'forest-moss',
            'defaultEnvelopeAnimation' => 'stage-curtain',
            'defaultStoryLayout' => 'timeline',
            'defaultAnimationIntensity' => 'subtle',
            'storyLayouts' => ['timeline', 'stacked'],
            'copy' => [
                'story.title' => 'Years of Service',
                'story.subtitle' => 'A career worth celebrating',
                'schedule.title' => 'Celebration Details',
                'schedule.subtitle' => 'Join us as we celebrate',
                'gallery.title' => 'Memories',
                'gallery.subtitle' => 'A look back through the years',
                'guestbook.title' => 'Wishes & Blessings',
                'guestbook.subtitle' => 'Leave a note to treasure',
            ],
        ],
    ];

    /**
     * Per-type validation rules for invitation_details.extra — appended to
     * UpdateInvitationRequest's rules when the invitation's type has entries
     * here. Types not listed accept no 'extra' fields.
     *
     * @return array<string, mixed>
     */
    public static function extraValidationRules(string $type): array
    {
        return match ($type) {
            'visiting_card' => [
                'detail.extra.jobTitle' => ['sometimes', 'nullable', 'string', 'max:120'],
                'detail.extra.company' => ['sometimes', 'nullable', 'string', 'max:120'],
                'detail.extra.socialLinks' => ['sometimes', 'nullable', 'array'],
                'detail.extra.socialLinks.*.platform' => ['required_with:detail.extra.socialLinks', 'string', 'max:40'],
                'detail.extra.socialLinks.*.url' => ['required_with:detail.extra.socialLinks', 'url', 'max:255'],
            ],
            'business_opening' => [
                'detail.extra.offerBanner' => ['sometimes', 'nullable', 'string', 'max:160'],
                'detail.extra.orderNowUrl' => ['sometimes', 'nullable', 'url', 'max:255'],
            ],
            'house_warming' => [
                'detail.extra.journeyStory' => ['sometimes', 'nullable', 'string', 'max:2000'],
            ],
            'anniversary' => [
                'detail.extra.yearsCount' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:150'],
            ],
            'reunion' => [
                'detail.extra.groupName' => ['sometimes', 'nullable', 'string', 'max:120'],
                'detail.extra.eraLabel' => ['sometimes', 'nullable', 'string', 'max:60'],
            ],
            'religious' => [
                'detail.extra.festivalName' => ['sometimes', 'nullable', 'string', 'max:120'],
                'detail.extra.donationUrl' => ['sometimes', 'nullable', 'url', 'max:255'],
            ],
            default => [],
        };
    }
}
