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
            $table->boolean('show_bride')->default(true)->after('connector');
            $table->boolean('show_groom')->default(true)->after('show_bride');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invitation_details', function (Blueprint $table) {
            $table->dropColumn(['show_bride', 'show_groom']);
        });
    }
};
