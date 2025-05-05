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
        Schema::table('subscriptions', function (Blueprint $table) {
            // Change column names to match the model
            $table->renameColumn('started_at', 'starts_at');
            $table->renameColumn('ends_at', 'expires_at');
            $table->renameColumn('auto_renew', 'is_auto_renew');
            
            // Add missing fields
            $table->string('plan')->after('plan_id')->nullable();
            $table->enum('duration', ['monthly', 'annual'])->after('status')->default('monthly');
            $table->integer('clients_limit')->after('duration')->default(0);
            $table->integer('campaigns_limit')->after('clients_limit')->default(0);
            $table->integer('sms_allowed')->after('campaigns_limit')->default(0);
            $table->integer('personal_sms_quota')->after('sms_allowed')->default(0);
            $table->integer('sms_used')->after('personal_sms_quota')->default(0);
            $table->integer('campaigns_used')->after('sms_used')->default(0);
            $table->date('next_renewal_date')->after('is_auto_renew')->nullable();
            $table->json('features')->after('next_renewal_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Remove added columns
            $table->dropColumn([
                'plan',
                'duration',
                'clients_limit',
                'campaigns_limit',
                'sms_allowed',
                'personal_sms_quota',
                'sms_used',
                'campaigns_used',
                'next_renewal_date',
                'features'
            ]);
            
            // Rename columns back to original names
            $table->renameColumn('starts_at', 'started_at');
            $table->renameColumn('expires_at', 'ends_at');
            $table->renameColumn('is_auto_renew', 'auto_renew');
        });
    }
};
