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
        Schema::table('pending_transactions', function (Blueprint $table) {
            // Supprimer l'index unique existant (s'il existe)
            $table->dropUnique('pending_transactions_reference_unique');
            
            // Recréer l'index avec une longueur limitée à 191 caractères
            $table->string('reference', 191)->change();
            $table->unique('reference');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pending_transactions', function (Blueprint $table) {
            // Supprimer l'index limité et rétablir l'index d'origine si nécessaire
            $table->dropUnique('pending_transactions_reference_unique');
        });
    }
};
