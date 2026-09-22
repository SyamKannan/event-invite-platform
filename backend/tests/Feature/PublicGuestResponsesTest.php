<?php

namespace Tests\Feature;

use App\Http\Controllers\Public\WishController;
use App\Models\Invitation;
use App\Models\Rsvp;
use App\Models\Wish;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The anonymous, guest-facing endpoints: RSVP (with same-device edits),
 * guestbook wishes (with pagination), spam protection, and the published
 * gate.
 */
class PublicGuestResponsesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_rsvp_to_a_published_invitation(): void
    {
        $invitation = Invitation::factory()->create();

        $response = $this->postJson("/api/invitations/{$invitation->slug}/rsvp", [
            'guest_name' => 'Aisha',
            'choice' => 'accept',
            'guest_count' => 3,
        ]);

        $response->assertCreated()->assertJsonStructure(['id', 'edit_token']);
        $this->assertDatabaseHas('rsvps', ['invitation_id' => $invitation->id, 'guest_name' => 'Aisha', 'guest_count' => 3]);
    }

    public function test_resubmitting_with_the_edit_token_updates_instead_of_duplicating(): void
    {
        $invitation = Invitation::factory()->create();

        $first = $this->postJson("/api/invitations/{$invitation->slug}/rsvp", [
            'guest_name' => 'Aisha', 'choice' => 'accept', 'guest_count' => 2,
        ])->json();

        $this->postJson("/api/invitations/{$invitation->slug}/rsvp", [
            'guest_name' => 'Aisha', 'choice' => 'decline',
            'rsvp_id' => $first['id'], 'edit_token' => $first['edit_token'],
        ])->assertOk();

        $this->assertSame(1, Rsvp::count());
        $this->assertSame('decline', Rsvp::first()->choice);
    }

    public function test_a_wrong_edit_token_cannot_overwrite_someone_elses_rsvp(): void
    {
        $invitation = Invitation::factory()->create();
        $victim = $this->postJson("/api/invitations/{$invitation->slug}/rsvp", [
            'guest_name' => 'Victim', 'choice' => 'accept',
        ])->json();

        $this->postJson("/api/invitations/{$invitation->slug}/rsvp", [
            'guest_name' => 'Attacker', 'choice' => 'decline',
            'rsvp_id' => $victim['id'], 'edit_token' => str_repeat('x', 40),
        ])->assertCreated();

        $this->assertSame('Victim', Rsvp::find($victim['id'])->guest_name);
        $this->assertSame(2, Rsvp::count());
    }

    public function test_edit_token_is_never_exposed_in_admin_listing(): void
    {
        $invitation = Invitation::factory()->create();
        Rsvp::factory()->for($invitation)->create(['edit_token' => str_repeat('a', 40)]);

        $this->assertArrayNotHasKey('edit_token', Rsvp::first()->toArray());
    }

    public function test_unpublished_invitation_rejects_rsvps_and_hides_config(): void
    {
        $invitation = Invitation::factory()->create(['is_published' => false]);

        $this->getJson("/api/invitations/{$invitation->slug}")->assertNotFound();
        $this->postJson("/api/invitations/{$invitation->slug}/rsvp", [
            'guest_name' => 'Aisha', 'choice' => 'accept',
        ])->assertNotFound();
    }

    public function test_honeypot_field_rejects_bot_submissions(): void
    {
        $invitation = Invitation::factory()->create();

        $this->postJson("/api/invitations/{$invitation->slug}/wishes", [
            'name' => 'Bot', 'message' => 'Buy now', 'website' => 'http://spam.example',
        ])->assertUnprocessable();

        $this->assertSame(0, Wish::count());
    }

    public function test_guest_submissions_are_rate_limited(): void
    {
        $invitation = Invitation::factory()->create();

        for ($i = 0; $i < 6; $i++) {
            $this->postJson("/api/invitations/{$invitation->slug}/wishes", [
                'name' => "Guest {$i}", 'message' => 'Congrats!',
            ])->assertCreated();
        }

        $this->postJson("/api/invitations/{$invitation->slug}/wishes", [
            'name' => 'One too many', 'message' => 'Congrats!',
        ])->assertTooManyRequests();
    }

    public function test_posted_wish_response_does_not_leak_internal_columns(): void
    {
        $invitation = Invitation::factory()->create();

        $response = $this->postJson("/api/invitations/{$invitation->slug}/wishes", [
            'name' => 'Aisha', 'message' => 'Congrats!',
        ]);

        $response->assertCreated()->assertJsonMissingPath('invitation_id');
    }

    public function test_wishes_are_paginated_with_a_before_cursor(): void
    {
        $invitation = Invitation::factory()->create();
        Wish::factory()->for($invitation)->count(WishController::PAGE_SIZE + 5)->create();

        $firstPage = $this->getJson("/api/invitations/{$invitation->slug}/wishes")->assertOk()->json();
        $this->assertCount(WishController::PAGE_SIZE, $firstPage);

        $lastId = end($firstPage)['id'];
        $secondPage = $this->getJson("/api/invitations/{$invitation->slug}/wishes?before={$lastId}")->json();
        $this->assertCount(5, $secondPage);
        $this->assertTrue(collect($secondPage)->every(fn ($w) => $w['id'] < $lastId));
    }

    public function test_countdown_is_disabled_until_an_event_date_is_set(): void
    {
        $invitation = Invitation::factory()->create(['type' => 'wedding']);
        $invitation->detail()->create([]);

        $config = $this->getJson("/api/invitations/{$invitation->slug}")->json('data');

        $this->assertNull($config['eventDateISO']);
        $this->assertFalse($config['countdown']['enabled']);
    }

    public function test_event_date_is_returned_as_a_utc_instant(): void
    {
        $invitation = Invitation::factory()->create(['type' => 'wedding']);
        $invitation->detail()->create(['event_date' => '2026-06-14 10:30:00']);

        $config = $this->getJson("/api/invitations/{$invitation->slug}")->json('data');

        $this->assertSame('2026-06-14T10:30:00+00:00', $config['eventDateISO']);
        $this->assertTrue($config['countdown']['enabled']);
    }
}
