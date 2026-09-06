<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Admin-created client accounts leave email blank (it's optional, "for
     * your own reference" per the admin UI copy) — but the column was still
     * NOT NULL from the original users migration, so creating a client with
     * no email threw a SQL constraint violation. Raw SQL here (not
     * Schema::table()->change()) to avoid pulling in doctrine/dbal just for
     * one column-nullability change.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // SQLite has no ALTER COLUMN; NOT NULL isn't enforced on existing
            // rows without a rebuild, and local dev seeding never needs this
            // path, so it's a no-op here.
            return;
        }

        DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            return;
        }

        DB::statement('ALTER TABLE users MODIFY email VARCHAR(255) NOT NULL');
    }
};
