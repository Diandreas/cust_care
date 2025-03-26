<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Laravel 12 supporte mieux les modifications d'enum
        // Note: Cette migration utilise addColumn+dropColumn car alter n'est pas supporté par tous les SGBD
        Schema::table('campaigns', function (Blueprint $table) {
            $table->enum('new_status', ['draft', 'scheduled', 'sending', 'sent', 'paused', 'failed'])
                ->default('draft')->after('status');
        });

        // Copie des valeurs
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
        // Migration inverse similaire...
    }
};
