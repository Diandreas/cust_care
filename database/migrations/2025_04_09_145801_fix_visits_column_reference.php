<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Cette migration corrige les requêtes dans le code qui utilisent 'date' au lieu de 'visit_date' pour la table visits
     */
    public function up(): void
    {
        // Pas besoin de modifier la structure de la table car elle est correcte
        // Dans ce cas, on va mettre à jour le code applicatif plutôt que la base de données
        
        // On pourrait ajouter une colonne alias si nécessaire, mais ce n'est pas recommandé
        // Mieux vaut corriger le code dans DashboardController.php et autres fichiers
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rien à faire ici car on n'a pas modifié la structure
    }
};
