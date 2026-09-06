<?php

namespace App\Console\Commands;

use App\Models\Invitation;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * One-off repair for milestones stuck at identical x/y coordinates.
 *
 * The admin editor used to send a fixed x:50, y:50 default for every new
 * milestone (the manual position sliders were removed from the UI, but the
 * create payload kept sending a default anyway). ConstellationLayout.jsx
 * only auto-spaces milestones whose x/y are missing entirely, so multiple
 * milestones sharing the same saved coordinates render stacked on top of
 * each other. The admin create payload no longer sends a default (x/y are
 * now nullable), but existing rows already saved with the old default need
 * a one-time fix here — there's no UI to edit milestone coordinates anymore.
 */
#[Signature('app:fix-duplicate-milestone-positions {--dry-run : Show what would change without saving}')]
#[Description('Re-space milestones that share identical x/y coordinates within the same invitation')]
class FixDuplicateMilestonePositions extends Command
{
    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $fixedInvitations = 0;
        $fixedMilestones = 0;

        Invitation::with('milestones')->each(function (Invitation $invitation) use ($dryRun, &$fixedInvitations, &$fixedMilestones) {
            $milestones = $invitation->milestones;

            if ($milestones->count() < 2) {
                return;
            }

            $hasDuplicate = $milestones
                ->groupBy(fn ($m) => "{$m->x},{$m->y}")
                ->contains(fn ($group) => $group->count() > 1);

            if (! $hasDuplicate) {
                return;
            }

            $fixedInvitations++;
            $total = $milestones->count();

            $this->line("Invitation #{$invitation->id} ({$invitation->slug}): re-spacing {$total} milestones");

            $milestones->values()->each(function ($milestone, $index) use ($total, $dryRun, &$fixedMilestones) {
                $x = $total <= 1 ? 50 : 18 + (64 * $index) / ($total - 1);
                $y = $index % 2 === 0 ? 72 : 24;
                $x = (int) round($x);
                $y = (int) round($y);

                $this->line("  - milestone #{$milestone->id} ({$milestone->title}): ({$milestone->x}, {$milestone->y}) -> ({$x}, {$y})");

                if (! $dryRun) {
                    $milestone->update(['x' => $x, 'y' => $y]);
                }

                $fixedMilestones++;
            });
        });

        if ($fixedInvitations === 0) {
            $this->info('No duplicate milestone positions found.');

            return self::SUCCESS;
        }

        $verb = $dryRun ? 'Would re-space' : 'Re-spaced';
        $this->info("{$verb} {$fixedMilestones} milestones across {$fixedInvitations} invitation(s).");

        return self::SUCCESS;
    }
}
