<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Configure MySQL pour utiliser utf8mb4 avec une longueur de 191 pour les clés
     */
    public function up(): void
    {
        // Cette configuration permet de résoudre le problème de longueur des clés dans MySQL
        Schema::defaultStringLength(191);
        
        // Configuration du charset et collation au niveau de la base de données
        DB::statement('ALTER DATABASE `helloboost` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        
        // On peut aussi ajouter des configurations spécifiques pour certaines tables si nécessaire
        // DB::statement('ALTER TABLE pending_transactions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Aucune action nécessaire pour annuler ces changements
    }
};
