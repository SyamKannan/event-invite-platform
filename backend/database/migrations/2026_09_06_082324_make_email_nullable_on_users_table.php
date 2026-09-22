<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Admin-created client accounts leave email blank (it's optional, "for
     * your own reference" per the admin UI copy) — but the column was still
     * NOT NULL from the original users migration, so creating a client with
     * no email threw a SQL constraint violation. Native ->change() (no
     * doctrine/dbal needed since Laravel 11) so the SQLite test database
     * gets the same column shape as MySQL.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('email')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('email')->nullable(false)->change();
        });
    }
};
