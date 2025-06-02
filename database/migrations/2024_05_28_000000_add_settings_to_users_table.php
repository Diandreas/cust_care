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
        Schema::table('users', function (Blueprint $table) {
            $table->json('settings')->nullable()->after('remember_token');
            $table->string('subscription_plan')->default('basic')->after('settings');
            $table->string('company_name')->nullable()->after('name');
            $table->string('timezone')->default('Europe/Paris')->after('company_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('settings');
            $table->dropColumn('subscription_plan');
            $table->dropColumn('company_name');
            $table->dropColumn('timezone');
        });
    }
}; 