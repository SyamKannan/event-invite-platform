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
        Schema::table('invitation_details', function (Blueprint $table) {
            $table->string('envelope_animation')->default('swing-doors')->after('envelope_cta');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitation_details', function (Blueprint $table) {
            $table->dropColumn('envelope_animation');
        });
    }
};
