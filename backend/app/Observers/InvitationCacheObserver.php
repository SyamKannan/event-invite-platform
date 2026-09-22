<?php

namespace App\Observers;

use App\Models\Invitation;
use App\Models\Wish;
use App\Support\InvitationCache;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Database\Eloquent\Model;

/**
 * Busts InvitationCache whenever an invitation or any of its public content
 * (detail, people, schedule, story, gallery, wishes) changes, so admin edits
 * show up on /i/{slug} immediately instead of after the TTL.
 *
 * Runs after commit: forgetting inside an open transaction would let a
 * concurrent public request re-cache the pre-commit data.
 */
class InvitationCacheObserver implements ShouldHandleEventsAfterCommit
{
    public function saved(Model $model): void
    {
        $this->flush($model);
    }

    public function deleted(Model $model): void
    {
        $this->flush($model);
    }

    private function flush(Model $model): void
    {
        if ($model instanceof Invitation) {
            // A slug rename must also drop the entry cached under the old slug.
            InvitationCache::forget($model, $model->getPrevious()['slug'] ?? '');

            return;
        }

        $slug = $model->invitation?->slug;

        if (! $slug) {
            return;
        }

        if ($model instanceof Wish) {
            InvitationCache::forgetWishes($slug);

            return;
        }

        InvitationCache::forget($slug);
    }
}
