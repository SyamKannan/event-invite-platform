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
        Schema::table('milestones', function (Blueprint $table) {
            $table->unsignedTinyInteger('x')->nullable()->change();
            $table->unsignedTinyInteger('y')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('milestones', function (Blueprint $table) {
            $table->unsignedTinyInteger('x')->nullable(false)->change();
            $table->unsignedTinyInteger('y')->nullable(false)->change();
        });
    }
};
