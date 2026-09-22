<?php

namespace Tests\Feature;

use App\Models\GalleryImage;
use App\Models\Invitation;
use App\Models\Milestone;
use App\Models\User;
use App\Models\Wish;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The public invitation/wishes endpoints are served from cache; every way
 * the underlying content can change must bust that cache, or guests see a
 * stale invitation until the TTL expires.
 */
class InvitationCacheTest extends TestCase
{
    use RefreshDatabase;

    private function queriesDuring(callable $callback): int
    {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $callback();
        DB::disableQueryLog();

        return count(DB::getQueryLog());
    }

    public function test_second_request_is_served_from_cache_without_queries(): void
    {
        $invitation = Invitation::factory()->create();

        $first = $this->getJson("/api/invitations/{$invitation->slug}")->assertOk();

        $queries = $this->queriesDuring(function () use ($invitation, $first): void {
            $this->getJson("/api/invitations/{$invitation->slug}")
                ->assertOk()
                ->assertExactJson($first->json());
        });

        $this->assertSame(0, $queries);
        $this->assertArrayHasKey('data', $first->json());
    }

    public function test_child_content_change_busts_the_cache(): void
    {
        $invitation = Invitation::factory()->create();
        $milestone = Milestone::factory()->for($invitation)->create(['title' => 'Before']);
        $this->getJson("/api/invitations/{$invitation->slug}")->assertOk();

        $milestone->update(['title' => 'After']);

        $this->assertStringContainsString('After', $this->getJson("/api/invitations/{$invitation->slug}")->getContent());
    }

    public function test_unpublishing_and_renaming_slug_bust_the_cache(): void
    {
        $invitation = Invitation::factory()->create(['slug' => 'old-slug']);
        $this->getJson('/api/invitations/old-slug')->assertOk();

        $invitation->update(['slug' => 'new-slug']);
        $this->getJson('/api/invitations/old-slug')->assertNotFound();
        $this->getJson('/api/invitations/new-slug')->assertOk();

        $invitation->update(['is_published' => false]);
        $this->getJson('/api/invitations/new-slug')->assertNotFound();
    }

    public function test_unpublished_invitation_is_never_cached(): void
    {
        $invitation = Invitation::factory()->create(['is_published' => false]);
        $this->getJson("/api/invitations/{$invitation->slug}")->assertNotFound();

        $invitation->updateQuietly(['is_published' => true]);

        $this->getJson("/api/invitations/{$invitation->slug}")->assertOk();
    }

    public function test_gallery_reorder_busts_the_cache(): void
    {
        $invitation = Invitation::factory()->create();
        $a = GalleryImage::factory()->for($invitation)->create(['sort_order' => 0, 'alt' => 'alt-aaa']);
        $b = GalleryImage::factory()->for($invitation)->create(['sort_order' => 1, 'alt' => 'alt-bbb']);
        $this->getJson("/api/invitations/{$invitation->slug}")->assertOk();

        $admin = User::factory()->create(['role' => 'admin']);
        $this->withHeader('Authorization', 'Bearer '.$admin->createToken('test')->plainTextToken)
            ->putJson("/api/admin/invitations/{$invitation->id}/gallery-images/reorder", ['ordered_ids' => [$b->id, $a->id]])
            ->assertNoContent();

        $body = $this->getJson("/api/invitations/{$invitation->slug}")->getContent();
        $this->assertLessThan(strpos($body, 'alt-aaa'), strpos($body, 'alt-bbb'));
    }

    public function test_new_wish_busts_the_cached_first_page(): void
    {
        $invitation = Invitation::factory()->create();
        $this->getJson("/api/invitations/{$invitation->slug}/wishes")->assertOk()->assertJsonCount(0);

        $this->postJson("/api/invitations/{$invitation->slug}/wishes", ['name' => 'Anu', 'message' => 'Congrats!'])
            ->assertCreated();

        $this->getJson("/api/invitations/{$invitation->slug}/wishes")->assertOk()->assertJsonCount(1);

        Wish::query()->first()->delete();
        $this->getJson("/api/invitations/{$invitation->slug}/wishes")->assertOk()->assertJsonCount(0);
    }
}
