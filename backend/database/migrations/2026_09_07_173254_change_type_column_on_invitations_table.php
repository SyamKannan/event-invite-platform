<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Widens invitations.type from enum('wedding','birthday') to a plain string
 * so new event types can be added via App\Support\EventTypes alone, with no
 * further migration. Non-destructive: existing 'wedding'/'birthday' values
 * remain valid strings. Uses raw SQL rather than Schema::table()->change()
 * since doctrine/dbal isn't installed in this project. SQLite (used by the
 * test suite) is untyped for this purpose — CHECK/ENUM constraints aren't
 * enforced the same way, so there is nothing to widen there.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE invitations MODIFY type VARCHAR(40) NOT NULL');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE invitations MODIFY type ENUM('wedding', 'birthday') NOT NULL");
        }
    }
};
