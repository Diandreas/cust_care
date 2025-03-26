<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Laravel supporte mieux les modifications d'enum
        // Note: Cette migration utilise addColumn+dropColumn car alter n'est pas supporté par tous les SGBD
        Schema::table('campaigns', function (Blueprint $table) {
            $table->enum('new_status', ['draft', 'scheduled', 'sending', 'sent', 'partially_sent', 'paused', 'failed', 'cancelled'])
                ->default('draft')->after('status');
        });

        // Copie des valeurs existantes
        DB::statement('UPDATE campaigns SET new_status = status');

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->renameColumn('new_status', 'status');
        });
    }

    public function down(): void
    {
        // Migration inverse
        Schema::table('campaigns', function (Blueprint $table) {
            $table->enum('old_status', ['draft', 'scheduled', 'sending', 'sent', 'paused', 'failed', 'cancelled'])
                ->default('draft')->after('status');
        });

        // Convertir 'partially_sent' vers 'sent'
        DB::statement("UPDATE campaigns SET old_status = CASE WHEN status = 'partially_sent' THEN 'sent' ELSE status END");

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->renameColumn('old_status', 'status');
        });
    }
}; 