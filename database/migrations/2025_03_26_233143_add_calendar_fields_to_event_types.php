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
        Schema::table('event_types', function (Blueprint $table) {
            if (!Schema::hasColumn('event_types', 'calendar_date')) {
                $table->string('calendar_date')->nullable();
                $table->integer('expected_audience_size')->default(0);
                $table->json('audience_requirements')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_types', function (Blueprint $table) {
            $table->dropColumn(['calendar_date', 'expected_audience_size', 'audience_requirements']);
        });
    }
};
