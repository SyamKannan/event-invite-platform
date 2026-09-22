<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Login (incl. brute-force throttling) and admin-only client management.
 */
class AdminAuthAndClientsTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): User
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->withHeader('Authorization', 'Bearer '.$admin->createToken('test')->plainTextToken);

        return $admin;
    }

    public function test_login_returns_a_token_for_valid_credentials(): void
    {
        User::factory()->create(['username' => 'host', 'password' => 'secret-pass']);

        $this->postJson('/api/admin/login', ['username' => 'host', 'password' => 'secret-pass'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'role']]);
    }

    public function test_login_is_throttled_after_repeated_failures(): void
    {
        User::factory()->create(['username' => 'host', 'password' => 'secret-pass']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/login', ['username' => 'host', 'password' => 'wrong'])->assertUnprocessable();
        }

        $this->postJson('/api/admin/login', ['username' => 'host', 'password' => 'secret-pass'])->assertTooManyRequests();
    }

    public function test_users_default_to_the_client_role(): void
    {
        $user = User::create(['name' => 'X', 'username' => 'x', 'password' => 'whatever1']);

        $this->assertSame('client', $user->fresh()->role);
    }

    public function test_admin_can_reset_a_client_password_which_revokes_their_tokens(): void
    {
        $this->actingAsAdmin();
        $client = User::factory()->create(['role' => 'client']);
        $client->createToken('old-device');

        $this->putJson("/api/admin/clients/{$client->id}", ['password' => 'brand-new-pass'])->assertOk();

        $this->assertSame(0, $client->tokens()->count());
        $this->postJson('/api/admin/login', ['username' => $client->username, 'password' => 'brand-new-pass'])->assertOk();
    }

    public function test_deleting_a_client_unassigns_their_invitations(): void
    {
        $this->actingAsAdmin();
        $client = User::factory()->create(['role' => 'client']);
        $invitation = Invitation::factory()->create(['owner_id' => $client->id]);

        $this->deleteJson("/api/admin/clients/{$client->id}")->assertNoContent();

        $this->assertModelMissing($client);
        $this->assertNull($invitation->fresh()->owner_id);
    }

    public function test_admin_accounts_cannot_be_managed_through_the_clients_endpoint(): void
    {
        $this->actingAsAdmin();
        $otherAdmin = User::factory()->create(['role' => 'admin']);

        $this->deleteJson("/api/admin/clients/{$otherAdmin->id}")->assertNotFound();
        $this->assertModelExists($otherAdmin);
    }

    public function test_a_client_cannot_manage_clients(): void
    {
        $client = User::factory()->create(['role' => 'client']);
        $this->withHeader('Authorization', 'Bearer '.$client->createToken('t')->plainTextToken);

        $this->getJson('/api/admin/clients')->assertForbidden();
    }

    public function test_invitation_can_only_be_assigned_to_a_client_account(): void
    {
        $admin = $this->actingAsAdmin();
        $invitation = Invitation::factory()->create();

        $this->putJson("/api/admin/invitations/{$invitation->id}", ['owner_id' => $admin->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('owner_id');
    }
}
