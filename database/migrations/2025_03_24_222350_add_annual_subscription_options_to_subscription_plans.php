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
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->decimal('annual_price', 10, 2)->nullable()->after('price');
            $table->boolean('has_annual_option')->default(false)->after('annual_price');
            $table->integer('annual_discount_percent')->default(0)->after('has_annual_option');
        });
        
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('duration')->default('monthly')->after('status'); // 'monthly' ou 'annual'
            $table->boolean('is_auto_renew')->default(true)->after('duration');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn(['annual_price', 'has_annual_option', 'annual_discount_percent']);
        });
        
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['duration', 'is_auto_renew']);
        });
    }
};
