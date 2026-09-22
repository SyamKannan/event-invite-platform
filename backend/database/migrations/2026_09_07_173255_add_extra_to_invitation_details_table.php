<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds a free-form JSON column for the type-specific fields new event types
 * need (e.g. visiting_card's jobTitle/socialLinks, business_opening's
 * offerBanner). Existing wedding/birthday-only columns are left untouched —
 * this column is used only for the new event types.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invitation_details', function (Blueprint $table) {
            $table->json('extra')->nullable()->after('celebrant_turning_text');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitation_details', function (Blueprint $table) {
            $table->dropColumn('extra');
        });
    }
};
