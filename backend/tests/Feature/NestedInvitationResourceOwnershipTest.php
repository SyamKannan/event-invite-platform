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
 * A client who owns invitation A must not be able to update or delete a
 * nested resource (person/schedule-event/milestone/gallery-image) that
 * belongs to invitation B, even though authorizeInvitation() only checks
 * that they own the {invitation} in the URL — the nested {resource} route
 * param is resolved by global ID, so it must also be scoped to that
 * invitation inside the controller.
 */
class NestedInvitationResourceOwnershipTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsClientOwning(Invitation $invitation): User
    {
        $client = User::factory()->create(['role' => 'client']);
        $invitation->update(['owner_id' => $client->id]);
        $token = $client->createToken('test')->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$token}");

        return $client;
    }

    public function test_client_cannot_update_milestone_belonging_to_another_invitation(): void
    {
        $owned = Invitation::factory()->create();
        $other = Invitation::factory()->create();
        $this->actingAsClientOwning($owned);

        $foreignMilestone = Milestone::factory()->for($other)->create(['title' => 'Original']);

        $response = $this->putJson("/api/admin/invitations/{$owned->id}/milestones/{$foreignMilestone->id}", [
            'date_label' => 'Day 1',
            'title' => 'Hijacked',
        ]);

        $response->assertNotFound();
        $this->assertSame('Original', $foreignMilestone->fresh()->title);
    }

    public function test_client_cannot_delete_milestone_belonging_to_another_invitation(): void
    {
        $owned = Invitation::factory()->create();
        $other = Invitation::factory()->create();
        $this->actingAsClientOwning($owned);

        $foreignMilestone = Milestone::factory()->for($other)->create();

        $response = $this->deleteJson("/api/admin/invitations/{$owned->id}/milestones/{$foreignMilestone->id}");

        $response->assertNotFound();
        $this->assertModelExists($foreignMilestone);
    }

    public function test_client_cannot_update_person_belonging_to_another_invitation(): void
    {
        $owned = Invitation::factory()->create(['type' => 'wedding']);
        $other = Invitation::factory()->create(['type' => 'wedding']);
        $this->actingAsClientOwning($owned);

        $foreignPerson = InvitationPerson::factory()->for($other)->create(['role' => 'bride']);

        $response = $this->putJson("/api/admin/invitations/{$owned->id}/people/{$foreignPerson->id}", [
            'role' => 'bride',
            'first_name' => 'Hijacked',
        ]);

        $response->assertNotFound();
    }

    public function test_client_cannot_delete_schedule_event_belonging_to_another_invitation(): void
    {
        $owned = Invitation::factory()->create();
        $other = Invitation::factory()->create();
        $this->actingAsClientOwning($owned);

        $foreignEvent = ScheduleEvent::factory()->for($other)->create();

        $response = $this->deleteJson("/api/admin/invitations/{$owned->id}/schedule-events/{$foreignEvent->id}");

        $response->assertNotFound();
        $this->assertModelExists($foreignEvent);
    }

    public function test_client_cannot_delete_gallery_image_belonging_to_another_invitation(): void
    {
        $owned = Invitation::factory()->create();
        $other = Invitation::factory()->create();
        $this->actingAsClientOwning($owned);

        $foreignImage = GalleryImage::factory()->for($other)->create();

        $response = $this->deleteJson("/api/admin/invitations/{$owned->id}/gallery-images/{$foreignImage->id}");

        $response->assertNotFound();
        $this->assertModelExists($foreignImage);
    }

    public function test_client_can_still_update_own_invitations_milestone(): void
    {
        $owned = Invitation::factory()->create();
        $this->actingAsClientOwning($owned);

        $milestone = Milestone::factory()->for($owned)->create(['title' => 'Original']);

        $response = $this->putJson("/api/admin/invitations/{$owned->id}/milestones/{$milestone->id}", [
            'date_label' => 'Day 1',
            'title' => 'Updated',
        ]);

        $response->assertOk();
        $this->assertSame('Updated', $milestone->fresh()->title);
    }
}
