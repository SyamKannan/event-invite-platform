<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Data fix: invitation_details.event_date used to be saved as the admin's
 * raw <input type="datetime-local"> value ("2026-06-14 16:00", meaning 4 PM
 * in the admin's own timezone), but the app runs in UTC — so the public
 * countdown treated it as 4 PM UTC (9:30 PM in India). The editor now sends
 * a real UTC instant; this reinterprets every pre-existing value as wall
 * clock time in LEGACY_EVENT_TIMEZONE (default Asia/Kolkata) and rewrites
 * it as UTC.
 *
 * A migration (not an artisan command) so it runs exactly once per
 * database and can never double-shift. On a fresh database it runs before
 * seeding, finds no rows, and is a no-op.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->shift(fn (CarbonImmutable $local): CarbonImmutable => $local->utc(), fromTimezone: $this->legacyTimezone());
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $this->shift(fn (CarbonImmutable $utc): CarbonImmutable => $utc->setTimezone($this->legacyTimezone()), fromTimezone: 'UTC');
    }

    private function legacyTimezone(): string
    {
        return (string) env('LEGACY_EVENT_TIMEZONE', 'Asia/Kolkata');
    }

    /**
     * @param  callable(CarbonImmutable): CarbonImmutable  $convert
     */
    private function shift(callable $convert, string $fromTimezone): void
    {
        DB::table('invitation_details')->whereNotNull('event_date')->orderBy('id')->each(function (object $row) use ($convert, $fromTimezone): void {
            $converted = $convert(CarbonImmutable::parse($row->event_date, $fromTimezone));

            DB::table('invitation_details')
                ->where('id', $row->id)
                ->update(['event_date' => $converted->format('Y-m-d H:i:s')]);
        });
    }
};
