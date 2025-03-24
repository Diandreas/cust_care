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
            // Supprimer les anciennes colonnes qui sont obsolètes ou dupliquées
            if (Schema::hasColumn('subscriptions', 'sms_allowed')) {
                $table->dropColumn('sms_allowed');
            }
            
            if (Schema::hasColumn('subscriptions', 'personal_sms_limit')) {
                $table->dropColumn('personal_sms_limit');
            }
            
            // Ajouter les colonnes manquantes si elles n'existent pas déjà
            if (!Schema::hasColumn('subscriptions', 'personal_sms_quota')) {
                $table->integer('personal_sms_quota')->default(0)->after('campaigns_limit');
            }
            
            if (!Schema::hasColumn('subscriptions', 'campaigns_used')) {
                $table->integer('campaigns_used')->default(0)->after('sms_used');
            }
            
            if (!Schema::hasColumn('subscriptions', 'campaign_sms_limit')) {
                $table->integer('campaign_sms_limit')->default(0)->after('campaigns_limit');
            }
            
            if (!Schema::hasColumn('subscriptions', 'next_renewal_date')) {
                $table->date('next_renewal_date')->nullable()->after('campaigns_used');
            }
            
            if (!Schema::hasColumn('subscriptions', 'auto_renew')) {
                $table->boolean('auto_renew')->default(true)->after('next_renewal_date');
            }
            
            if (!Schema::hasColumn('subscriptions', 'features')) {
                $table->json('features')->nullable()->after('auto_renew');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Restaurer les colonnes originales
            $table->integer('sms_allowed')->default(0);
            $table->integer('personal_sms_limit')->default(0);
            
            // Supprimer les nouvelles colonnes
            $table->dropColumn([
                'personal_sms_quota',
                'campaigns_used',
                'campaign_sms_limit',
                'next_renewal_date',
                'auto_renew',
                'features'
            ]);
        });
    }
};
