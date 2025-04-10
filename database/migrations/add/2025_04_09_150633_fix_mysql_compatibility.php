<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Cette migration modifie les requêtes SQL pour assurer la compatibilité avec MySQL.
     * Les fonctions spécifiques à SQLite (comme strftime) sont remplacées par l'équivalent MySQL.
     */
    public function up(): void
    {
        // Corrections apportées dans le code pour MySQL
        // 1. Remplacé strftime('%m', field) par MONTH(field)
        // 2. Remplacé strftime('%Y', field) par YEAR(field)
        // 3. Remplacé date(field) par DATE(field)
        // 4. Corrigé la référence à la colonne 'date' dans les requêtes sur les visites par 'visit_date'
        
        // Aucune modification de base de données nécessaire
        // Les corrections sont dans le code:
        // - ClientController.php
        // - DashboardController.php
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Aucune action nécessaire car nous n'avons pas modifié la structure de la base de données
    }
};
