<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\EventTypes;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Every event type must open looking and feeling different — a distinct
 * default theme, opening (envelope) animation, and motion intensity — so an
 * admin who spins up a "Small Business Grand Opening" and a "House Warming"
 * back to back doesn't get two invitations that only differ by copy.
 *
 * Regression coverage for a real bug: EventTypes::ALL used to default
 * wedding/birthday/baby_naming to the same theme preset (and every type
 * opened with the same envelope animation, since InvitationController::store
 * didn't seed one at all) — so several event types were visually
 * indistinguishable at creation time.
 */
class EventTypeDefaultsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$token}");

        return $admin;
    }

    public function test_every_event_type_has_a_unique_default_theme_preset(): void
    {
        $presets = array_column(EventTypes::ALL, 'defaultThemePreset');

        $this->assertSame(
            count($presets),
            count(array_unique($presets)),
            'Two event types share the same defaultThemePreset — they will look identical at creation.'
        );
    }

    public function test_every_event_type_has_a_unique_default_envelope_animation(): void
    {
        $animations = array_column(EventTypes::ALL, 'defaultEnvelopeAnimation');

        $this->assertSame(
            count($animations),
            count(array_unique($animations)),
            'Two event types share the same defaultEnvelopeAnimation — their opening moment will look identical.'
        );
    }

    public function test_every_default_story_layout_is_allowed_for_its_own_type(): void
    {
        foreach (EventTypes::ALL as $type => $config) {
            if (! isset($config['defaultStoryLayout'])) {
                continue;
            }

            $this->assertContains(
                $config['defaultStoryLayout'],
                $config['storyLayouts'],
                "'{$type}''s defaultStoryLayout is not in its own storyLayouts list."
            );
        }
    }

    public function test_creating_a_birthday_invitation_seeds_its_type_defaults(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/invitations', [
            'slug' => 'test-birthday-defaults',
            'type' => 'birthday',
        ]);

        $response->assertCreated();
        $config = EventTypes::ALL['birthday'];

        $this->assertSame($config['defaultStoryLayout'], $response->json('data.story_layout'));
        $this->assertSame($config['defaultAnimationIntensity'], $response->json('data.animation_intensity'));
        $this->assertSame($config['defaultEnvelopeAnimation'], $response->json('data.detail.envelope_animation'));
    }

    public function test_creating_a_business_opening_invitation_seeds_its_type_defaults(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/invitations', [
            'slug' => 'test-business-opening-defaults',
            'type' => 'business_opening',
        ]);

        $response->assertCreated();
        $config = EventTypes::ALL['business_opening'];

        $this->assertSame($config['defaultAnimationIntensity'], $response->json('data.animation_intensity'));
        $this->assertSame($config['defaultEnvelopeAnimation'], $response->json('data.detail.envelope_animation'));

        // business_opening declares no storyLayouts, so falls back to the
        // model/DB column default rather than a type-specific one.
        $this->assertSame('constellation', $response->json('data.story_layout'));
    }

    public function test_wedding_invitation_still_gets_its_connector_default(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/invitations', [
            'slug' => 'test-wedding-connector',
            'type' => 'wedding',
        ]);

        $response->assertCreated();
        $this->assertSame('&', $response->json('data.detail.connector'));
        $this->assertSame(EventTypes::ALL['wedding']['defaultEnvelopeAnimation'], $response->json('data.detail.envelope_animation'));
    }
}
