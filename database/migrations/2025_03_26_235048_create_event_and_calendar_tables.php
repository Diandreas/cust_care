<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Création des tables pour la gestion des événements et du calendrier
     */
    public function up(): void
    {
        // Table des types d'événements
        Schema::create('event_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('category', ['personal', 'calendar', 'marketing', 'recurring']);
            $table->text('default_template');
            $table->boolean('is_global')->default(true);
            $table->enum('date_type', ['fixed_date', 'dynamic_date', 'client_field']);
            $table->json('date_parameters')->nullable();
            $table->enum('audience_logic', ['all', 'male', 'female', 'specific_tags', 'specific_category']);
            $table->json('audience_parameters')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });


        // Table des événements du calendrier
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->enum('category', ['personal', 'calendar', 'marketing', 'recurring']);
            $table->boolean('is_global')->default(true);
            $table->string('month', 2); // Format: 01-12
            $table->string('day', 2);   // Format: 01-31
            $table->json('metadata')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Suppression des tables d'événements et calendrier
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
        Schema::dropIfExists('event_types');
    }
};
