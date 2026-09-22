<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Widens invitation_people.role from enum('bride','groom','celebrant') to a
 * plain string so new event types (e.g. 'owner', 'host', 'honoree') can use
 * this table without a migration, validated against
 * App\Support\EventTypes::ALL[$type]['roles'] instead of a DB enum.
 * Non-destructive: existing role values remain valid strings.
 *
 * Uses Schema::table()->change() (not a raw driver-specific DB::statement)
 * so it widens the column on every driver the app runs on, SQLite included.
 * An earlier version of this migration only ran on MySQL, on the mistaken
 * assumption SQLite is untyped here — Laravel actually compiles enum() to a
 * CHECK constraint on SQLite too, so the phpunit test suite (which runs
 * against sqlite :memory:) was silently rejecting every non-wedding/birthday
 * role (owner, host, honoree, organizer, celebrant1/2, baby) even though
 * production (MySQL) had been correctly widened.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invitation_people', function (Blueprint $table): void {
            $table->string('role', 30)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitation_people', function (Blueprint $table): void {
            $table->enum('role', ['bride', 'groom', 'celebrant'])->change();
        });
    }
};
