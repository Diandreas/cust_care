<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            if (!Schema::hasColumn('plans', 'code')) {
                $table->string('code')->nullable()->after('name');
            }
            
            if (!Schema::hasColumn('plans', 'annual_price')) {
                $table->decimal('annual_price', 10, 2)->default(0)->after('price');
            }
            
            if (!Schema::hasColumn('plans', 'annual_discount_percent')) {
                $table->integer('annual_discount_percent')->default(20)->after('annual_price');
            }
            
            if (!Schema::hasColumn('plans', 'max_campaigns_per_month')) {
                $table->integer('max_campaigns_per_month')->default(0)->after('max_clients');
            }
            
            if (!Schema::hasColumn('plans', 'total_campaign_sms')) {
                $table->integer('total_campaign_sms')->default(0)->after('max_campaigns_per_month');
            }
            
            if (!Schema::hasColumn('plans', 'monthly_sms_quota')) {
                $table->integer('monthly_sms_quota')->default(0)->after('total_campaign_sms');
            }
            
            if (!Schema::hasColumn('plans', 'monthly_messages')) {
                $table->integer('monthly_messages')->default(0)->after('monthly_sms_quota');
            }
            
            if (!Schema::hasColumn('plans', 'monthly_campaigns')) {
                $table->integer('monthly_campaigns')->default(0)->after('monthly_messages');
            }
            
            if (!Schema::hasColumn('plans', 'unused_sms_rollover_percent')) {
                $table->decimal('unused_sms_rollover_percent', 5, 2)->default(0)->after('monthly_campaigns');
            }
            
            if (!Schema::hasColumn('plans', 'description')) {
                $table->text('description')->nullable()->after('unused_sms_rollover_percent');
            }
        });
        
        // Set default values for existing records if any
        DB::statement('UPDATE plans SET monthly_messages = 0, monthly_campaigns = 0 WHERE monthly_messages IS NULL OR monthly_campaigns IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'code',
                'annual_price',
                'annual_discount_percent',
                'max_campaigns_per_month',
                'total_campaign_sms',
                'monthly_sms_quota',
                'monthly_messages',
                'monthly_campaigns',
                'unused_sms_rollover_percent',
                'description'
            ]);
        });
    }
};
