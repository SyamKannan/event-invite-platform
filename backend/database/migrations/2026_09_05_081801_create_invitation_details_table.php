<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invitation_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invitation_id')->unique()->constrained()->cascadeOnDelete();

            // Shared by both invitation types.
            $table->dateTime('event_date')->nullable();
            $table->string('display_date')->nullable();
            $table->string('display_time')->nullable();
            $table->string('display_location')->nullable();
            $table->string('hero_image')->nullable();
            $table->string('hero_overline')->nullable();
            $table->string('hero_tagline')->nullable();
            $table->string('envelope_overline')->nullable();
            $table->string('envelope_cta')->nullable();
            $table->boolean('music_enabled')->default(false);
            $table->string('music_src')->nullable();
            $table->string('contact_phone_primary')->nullable();
            $table->string('contact_phone_secondary')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_instagram')->nullable();
            $table->boolean('floating_decor_enabled')->default(true);
            $table->unsignedSmallInteger('floating_decor_count')->default(14);

            // Wedding-only.
            $table->string('connector')->default('&');

            // Birthday-only.
            $table->unsignedSmallInteger('celebrant_age')->nullable();
            $table->string('celebrant_turning_text')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invitation_details');
    }
};
