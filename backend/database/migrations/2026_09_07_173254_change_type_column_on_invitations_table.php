<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Widens invitations.type from enum('wedding','birthday') to a plain string
 * so new event types can be added via App\Support\EventTypes alone, with no
 * further migration. Non-destructive: existing 'wedding'/'birthday' values
 * remain valid strings. Uses the schema builder's native ->change() (no
 * doctrine/dbal needed since Laravel 11) so it runs identically on MySQL
 * and on the SQLite test database, instead of being skipped there.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invitations', function (Blueprint $table): void {
            $table->string('type', 40)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitations', function (Blueprint $table): void {
            $table->enum('type', ['wedding', 'birthday'])->change();
        });
    }
};
