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
            $table->foreignId('plan_id')->nullable()->after('user_id')
                  ->constrained('subscription_plans')->nullOnDelete();
            
            // Assurez-vous que la colonne duration existe
            if (!Schema::hasColumn('subscriptions', 'duration')) {
                $table->enum('duration', ['monthly', 'annual'])->default('monthly')->after('status');
            }
            
            // Renommer auto_renew en is_auto_renew si nécessaire
            if (Schema::hasColumn('subscriptions', 'auto_renew') && !Schema::hasColumn('subscriptions', 'is_auto_renew')) {
                $table->renameColumn('auto_renew', 'is_auto_renew');
            } elseif (!Schema::hasColumn('subscriptions', 'is_auto_renew')) {
                $table->boolean('is_auto_renew')->default(true)->after('next_renewal_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            // Supprimer la colonne plan_id
            $table->dropForeign(['plan_id']);
            $table->dropColumn('plan_id');
            
            // Renommer is_auto_renew en auto_renew si c'était le cas
            if (Schema::hasColumn('subscriptions', 'is_auto_renew') && !Schema::hasColumn('subscriptions', 'auto_renew')) {
                $table->renameColumn('is_auto_renew', 'auto_renew');
            }
            
            // Supprimer la colonne duration si elle a été ajoutée
            if (Schema::hasColumn('subscriptions', 'duration')) {
                $table->dropColumn('duration');
            }
        });
    }
};
