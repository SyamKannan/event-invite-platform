<?php

namespace Tests\Feature;

use App\Models\GalleryImage;
use App\Models\Invitation;
use App\Models\InvitationPerson;
use App\Models\Milestone;
use App\Models\ScheduleEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Two independent guarantees for nested invitation resources:
 *
 *  1. Scoping — a nested {resource} route param is resolved by global ID,
 *     so the controller must also scope it to the {invitation} in the URL.
 *     /invitations/A/milestones/{id-of-B's-milestone} must 404, even for an
 *     admin who could edit both.
 *  2. Role — clients are view-only. Even on the invitation they own, every
 *     content write is refused with 403.
 */
class NestedInvitationResourceOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->withHeader('Authorization', 'Bearer '.$admin->createToken('test')->plainTextToken);

        return $admin;
    }

    private function actingAsClientOwning(Invitation $invitation): User
    {
        $client = User::factory()->create(['role' => 'client']);
        $invitation->update(['owner_id' => $client->id]);
        $this->withHeader('Authorization', 'Bearer '.$client->createToken('test')->plainTextToken);

        return $client;
    }

    public function test_milestone_from_another_invitation_cannot_be_updated_through_this_one(): void
    {
        $owned = Invitation::factory()->create();
        $other = Invitation::factory()->create();
        $this->actingAsAdmin();

        $foreignMilestone = Milestone::factory()->for($other)->create(['title' => 'Original']);

        $response = $this->putJson("/api/admin/invitations/{$owned->id}/milestones/{$foreignMilestone->id}", [
            'date_label' => 'Day 1',
            'title' => 'Hijacked',
        ]);

        $response->assertNotFound();
        $this->assertSame('Original', $foreignMilestone->fresh()->title);
    }

    public function test_milestone_from_another_invitation_cannot_be_deleted_through_this_one(): void
    {
        $owned = Invitation::factory()->create();
        $other = Invitation::factory()->create();
        $this->actingAsAdmin();

        $foreignMilestone = Milestone::factory()->for($other)->create();

        $this->deleteJson("/api/admin/invitations/{$owned->id}/milestones/{$foreignMilestone->id}")->assertNotFound();
        $this->assertModelExists($foreignMilestone);
    }

    public function test_person_from_another_invitation_cannot_be_updated_through_this_one(): void
    {
        $owned = Invitation::factory()->create(['type' => 'wedding']);
        $other = Invitation::factory()->create(['type' => 'wedding']);
        $this->actingAsAdmin();

        $foreignPerson = InvitationPerson::factory()->for($other)->create(['role' => 'bride', 'first_name' => 'Original']);

        $this->putJson("/api/admin/invitations/{$owned->id}/people/{$foreignPerson->id}", [
            'role' => 'bride',
            'first_name' => 'Hijacked',
        ])->assertNotFound();

        $this->assertSame('Original', $foreignPerson->fresh()->first_name);
    }

    public function test_schedule_event_from_another_invitation_cannot_be_deleted_through_this_one(): void
    {
        $owned = Invitation::factory()->create();
        $other = Invitation::factory()->create();
        $this->actingAsAdmin();

        $foreignEvent = ScheduleEvent::factory()->for($other)->create();

        $this->deleteJson("/api/admin/invitations/{$owned->id}/schedule-events/{$foreignEvent->id}")->assertNotFound();
        $this->assertModelExists($foreignEvent);
    }

    public function test_gallery_image_from_another_invitation_cannot_be_deleted_through_this_one(): void
    {
        $owned = Invitation::factory()->create();
        $other = Invitation::factory()->create();
        $this->actingAsAdmin();

        $foreignImage = GalleryImage::factory()->for($other)->create();

        $this->deleteJson("/api/admin/invitations/{$owned->id}/gallery-images/{$foreignImage->id}")->assertNotFound();
        $this->assertModelExists($foreignImage);
    }

    public function test_client_cannot_edit_content_of_their_own_invitation(): void
    {
        $owned = Invitation::factory()->create();
        $this->actingAsClientOwning($owned);

        $milestone = Milestone::factory()->for($owned)->create(['title' => 'Original']);

        $this->putJson("/api/admin/invitations/{$owned->id}/milestones/{$milestone->id}", [
            'date_label' => 'Day 1',
            'title' => 'Updated',
        ])->assertForbidden();

        $this->postJson("/api/admin/invitations/{$owned->id}/schedule-events", [
            'title' => 'Sneaky', 'event_date' => '2026-12-12', 'event_time' => '5 PM', 'venue' => 'X',
        ])->assertForbidden();

        $this->assertSame('Original', $milestone->fresh()->title);
    }

    public function test_client_cannot_update_or_delete_their_own_invitation(): void
    {
        $owned = Invitation::factory()->create(['slug' => 'keep-me']);
        $this->actingAsClientOwning($owned);

        $this->putJson("/api/admin/invitations/{$owned->id}", ['slug' => 'changed', 'is_published' => false])
            ->assertForbidden();
        $this->deleteJson("/api/admin/invitations/{$owned->id}")->assertForbidden();

        $this->assertSame('keep-me', $owned->fresh()->slug);
        $this->assertTrue($owned->fresh()->is_published);
    }

    public function test_client_cannot_upload_files_to_their_own_invitation(): void
    {
        $owned = Invitation::factory()->create();
        $this->actingAsClientOwning($owned);

        $this->postJson("/api/admin/invitations/{$owned->id}/upload", [])->assertForbidden();
    }

    public function test_client_can_view_their_own_invitation_and_its_rsvps(): void
    {
        $owned = Invitation::factory()->create();
        $this->actingAsClientOwning($owned);

        $this->getJson("/api/admin/invitations/{$owned->id}")->assertOk();
        $this->getJson("/api/admin/invitations/{$owned->id}/rsvps")->assertOk();
        $this->getJson("/api/admin/invitations/{$owned->id}/wishes")->assertOk();
    }

    public function test_client_cannot_view_someone_elses_invitation(): void
    {
        $owned = Invitation::factory()->create();
        $other = Invitation::factory()->create();
        $this->actingAsClientOwning($owned);

        $this->getJson("/api/admin/invitations/{$other->id}")->assertForbidden();
        $this->getJson("/api/admin/invitations/{$other->id}/rsvps")->assertForbidden();
    }
}
