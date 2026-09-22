<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\Rsvp;
use App\Models\User;
use App\Models\Wish;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Covers the admin dashboard's data endpoints: paginated/filterable
 * invitation listing and platform-wide stats — both scoped by role the same
 * way the rest of the admin API is (admin sees everything, client sees only
 * invitations they own).
 */
class AdminInvitationDashboardTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('test')->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$token}");

        return $admin;
    }

    private function actingAsClient(): User
    {
        $client = User::factory()->create(['role' => 'client']);
        $token = $client->createToken('test')->plainTextToken;
        $this->withHeader('Authorization', "Bearer {$token}");

        return $client;
    }

    public function test_index_filters_by_type(): void
    {
        $this->actingAsAdmin();
        Invitation::factory()->create(['type' => 'wedding']);
        Invitation::factory()->create(['type' => 'birthday']);

        $response = $this->getJson('/api/admin/invitations?type=birthday');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('birthday', $response->json('data.0.type'));
    }

    public function test_index_filters_by_status(): void
    {
        $this->actingAsAdmin();
        Invitation::factory()->create(['is_published' => true]);
        Invitation::factory()->create(['is_published' => false]);

        $response = $this->getJson('/api/admin/invitations?status=draft');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertFalse($response->json('data.0.is_published'));
    }

    public function test_index_filters_by_search(): void
    {
        $this->actingAsAdmin();
        Invitation::factory()->create(['slug' => 'aisha-and-rahul']);
        Invitation::factory()->create(['slug' => 'priyas-30th']);

        $response = $this->getJson('/api/admin/invitations?search=aisha');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('aisha-and-rahul', $response->json('data.0.slug'));
    }

    public function test_index_paginates_results(): void
    {
        $this->actingAsAdmin();
        Invitation::factory()->count(15)->create();

        $response = $this->getJson('/api/admin/invitations?per_page=10');

        $response->assertOk();
        $this->assertCount(10, $response->json('data'));
        $this->assertSame(15, $response->json('meta.total'));
        $this->assertSame(2, $response->json('meta.last_page'));
    }

    public function test_client_only_sees_own_invitations_in_index(): void
    {
        $client = $this->actingAsClient();
        $owned = Invitation::factory()->create(['owner_id' => $client->id]);
        Invitation::factory()->create();

        $response = $this->getJson('/api/admin/invitations');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertSame($owned->id, $response->json('data.0.id'));
    }

    public function test_stats_returns_totals_for_admin(): void
    {
        $this->actingAsAdmin();
        $published = Invitation::factory()->create(['is_published' => true]);
        Invitation::factory()->create(['is_published' => false]);
        Rsvp::factory()->for($published)->create();
        Wish::factory()->for($published)->create();
        Wish::factory()->for($published)->create();

        $response = $this->getJson('/api/admin/invitations/stats');

        $response->assertOk();
        $response->assertJson([
            'total' => 2,
            'published' => 1,
            'draft' => 1,
            'rsvps' => 1,
            'wishes' => 2,
        ]);
    }

    public function test_stats_scoped_to_own_invitations_for_client(): void
    {
        $client = $this->actingAsClient();
        $owned = Invitation::factory()->create(['owner_id' => $client->id]);
        $other = Invitation::factory()->create();
        Rsvp::factory()->for($owned)->create();
        Rsvp::factory()->for($other)->create();

        $response = $this->getJson('/api/admin/invitations/stats');

        $response->assertOk();
        $this->assertSame(1, $response->json('total'));
        $this->assertSame(1, $response->json('rsvps'));
    }
}
