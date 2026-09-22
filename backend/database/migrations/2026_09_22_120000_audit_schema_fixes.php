<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Schema fixes from the 2026-09 audit:
 *  - users.role defaulted to 'admin', so any user created without an
 *    explicit role silently became a platform admin. Least privilege now.
 *  - meta_description / map_url were VARCHAR(255) while validation allowed
 *    500 chars, so a long value 500'd on MySQL strict mode instead of saving.
 *  - rsvps.edit_token lets a guest change their own earlier response from
 *    the same device instead of creating a duplicate RSVP.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('role')->default('client')->change();
        });

        Schema::table('invitations', function (Blueprint $table): void {
            $table->string('meta_description', 500)->nullable()->change();
        });

        Schema::table('schedule_events', function (Blueprint $table): void {
            $table->string('map_url', 500)->nullable()->change();
        });

        Schema::table('rsvps', function (Blueprint $table): void {
            $table->string('edit_token', 40)->nullable()->after('note');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rsvps', function (Blueprint $table): void {
            $table->dropColumn('edit_token');
        });

        Schema::table('schedule_events', function (Blueprint $table): void {
            $table->string('map_url')->nullable()->change();
        });

        Schema::table('invitations', function (Blueprint $table): void {
            $table->string('meta_description')->nullable()->change();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->string('role')->default('admin')->change();
        });
    }
};
