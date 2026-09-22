<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\Rsvp;
use App\Models\ScheduleEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Admin editing edge cases that used to 500 or corrupt data, plus RSVP
 * moderation/export.
 */
class AdminInvitationEditingTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->withHeader('Authorization', 'Bearer '.$admin->createToken('test')->plainTextToken);

        return $admin;
    }

    public function test_clearing_the_connector_falls_back_to_the_default_instead_of_erroring(): void
    {
        $this->actingAsAdmin();
        $invitation = Invitation::factory()->create(['type' => 'wedding']);
        $invitation->detail()->create(['connector' => '+']);

        $this->putJson("/api/admin/invitations/{$invitation->id}", ['detail' => ['connector' => '']])->assertOk();

        $this->assertSame('&', $invitation->detail->fresh()->connector);
    }

    public function test_long_meta_description_within_the_limit_saves(): void
    {
        $this->actingAsAdmin();
        $invitation = Invitation::factory()->create();

        $this->putJson("/api/admin/invitations/{$invitation->id}", ['meta_description' => str_repeat('a', 480)])->assertOk();

        $this->assertSame(480, strlen($invitation->fresh()->meta_description));
    }

    public function test_people_with_a_blank_name_can_be_saved(): void
    {
        $this->actingAsAdmin();
        $invitation = Invitation::factory()->create(['type' => 'wedding']);

        $this->putJson("/api/admin/invitations/{$invitation->id}", [
            'people' => [
                ['role' => 'bride', 'first_name' => 'Aisha'],
                ['role' => 'groom', 'first_name' => ''],
            ],
            'detail' => ['show_groom' => false],
        ])->assertOk();

        $this->assertSame('', $invitation->people()->where('role', 'groom')->first()->first_name);
    }

    public function test_theme_rejects_unknown_keys_and_non_rgb_values(): void
    {
        $this->actingAsAdmin();
        $invitation = Invitation::factory()->create();

        $this->putJson("/api/admin/invitations/{$invitation->id}", ['theme' => ['bg' => 'red; background:url(x)']])
            ->assertJsonValidationErrors('theme.bg');
        $this->putJson("/api/admin/invitations/{$invitation->id}", ['theme' => ['evil' => '1 2 3']])
            ->assertJsonValidationErrors('theme');
        $this->putJson("/api/admin/invitations/{$invitation->id}", ['theme' => ['bg' => '50 12 24']])
            ->assertOk();
    }

    public function test_creating_an_invitation_with_a_theme_is_a_single_request(): void
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/admin/invitations', [
            'slug' => 'new-one', 'type' => 'wedding', 'theme' => ['accent' => '212 168 95'],
        ])->assertCreated();

        $this->assertSame('212 168 95', $response->json('data.theme.accent'));
        // Seeded people carry no placeholder names that could leak publicly.
        $this->assertSame(['', ''], collect($response->json('data.people'))->pluck('first_name')->all());
    }

    public function test_schedule_event_date_serializes_as_a_plain_date(): void
    {
        $event = ScheduleEvent::factory()->for(Invitation::factory())->create(['event_date' => '2026-12-12']);

        $this->assertSame('2026-12-12', $event->toArray()['event_date']);
    }

    public function test_deleting_an_invitation_removes_its_uploaded_files(): void
    {
        Storage::fake('public');
        $this->actingAsAdmin();
        $invitation = Invitation::factory()->create();

        $path = $this->post("/api/admin/invitations/{$invitation->id}/upload", [
            'file' => UploadedFile::fake()->image('hero.jpg'),
        ])->assertCreated()->json('path');
        $this->putJson("/api/admin/invitations/{$invitation->id}", ['detail' => ['hero_image' => $path]])->assertOk();

        Storage::disk('public')->assertExists($path);

        $this->deleteJson("/api/admin/invitations/{$invitation->id}")->assertNoContent();

        Storage::disk('public')->assertMissing($path);
    }

    public function test_admin_payload_includes_resolved_file_urls(): void
    {
        $this->actingAsAdmin();
        $invitation = Invitation::factory()->create();
        $invitation->galleryImages()->create(['image' => 'invitations/x/images/a.jpg']);

        $url = $this->getJson("/api/admin/invitations/{$invitation->id}")->json('data.gallery_images.0.image_url');

        $this->assertStringEndsWith('/storage/invitations/x/images/a.jpg', $url);
    }

    public function test_owner_can_delete_an_rsvp_but_not_one_from_another_invitation(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $owned = Invitation::factory()->create(['owner_id' => $client->id]);
        $other = Invitation::factory()->create();
        $mine = Rsvp::factory()->for($owned)->create();
        $foreign = Rsvp::factory()->for($other)->create();
        $this->withHeader('Authorization', 'Bearer '.$client->createToken('t')->plainTextToken);

        $this->deleteJson("/api/admin/invitations/{$owned->id}/rsvps/{$foreign->id}")->assertNotFound();
        $this->deleteJson("/api/admin/invitations/{$owned->id}/rsvps/{$mine->id}")->assertNoContent();

        $this->assertModelMissing($mine);
        $this->assertModelExists($foreign);
    }

    public function test_draft_can_be_previewed_by_admin_and_owner_but_not_publicly(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $draft = Invitation::factory()->create(['is_published' => false, 'owner_id' => $client->id, 'type' => 'wedding']);
        $draft->detail()->create(['event_date' => '2026-06-14 10:30:00']);
        $stranger = User::factory()->create(['role' => 'client']);

        // Public route still hides drafts.
        $this->getJson("/api/invitations/{$draft->slug}")->assertNotFound();

        // forgetGuards() between identities: the auth guard caches the
        // resolved user across requests within a single test, so without it
        // every later request keeps the first token's user.
        $this->withHeader('Authorization', 'Bearer '.$stranger->createToken('t')->plainTextToken)
            ->getJson("/api/admin/invitations/{$draft->id}/preview")->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$client->createToken('t')->plainTextToken)
            ->getJson("/api/admin/invitations/{$draft->id}/preview")->assertOk();

        $this->app['auth']->forgetGuards();
        $this->actingAsAdmin();
        $this->getJson("/api/admin/invitations/{$draft->id}/preview")
            ->assertOk()
            ->assertJsonPath('data.slug', $draft->slug)
            ->assertJsonPath('data.eventDateISO', '2026-06-14T10:30:00+00:00');
    }

    public function test_csv_export_neutralizes_spreadsheet_formulas(): void
    {
        $this->actingAsAdmin();
        $invitation = Invitation::factory()->create();
        Rsvp::factory()->for($invitation)->create(['guest_name' => '=HYPERLINK("http://evil","x")']);

        $csv = $this->get("/api/admin/invitations/{$invitation->id}/rsvps/export")->streamedContent();

        $this->assertStringContainsString("'=HYPERLINK", $csv);
    }
}
