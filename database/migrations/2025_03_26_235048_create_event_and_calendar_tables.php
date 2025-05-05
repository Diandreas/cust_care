<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Création des tables d'événements, campagnes et calendrier
     */
    public function up(): void
    {
        // Table des types d'événements
        Schema::create('event_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('icon')->nullable();
            $table->string('color')->default('#3B82F6');
            $table->boolean('is_system')->default(false);
            $table->boolean('is_personal')->default(false);
            $table->timestamps();
        });

        // Table des événements
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignId('event_type_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->boolean('is_all_day')->default(true);
            $table->boolean('is_recurring')->default(false);
            $table->string('recurrence_rule')->nullable();
            $table->boolean('display_on_calendar')->default(true);
            $table->timestamps();
        });

        // Table des préférences d'événements personnels par client
        Schema::create('client_event_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('event_type_id')->constrained()->onDelete('cascade');
            $table->boolean('send_notification')->default(true);
            $table->integer('days_before')->default(7);
            $table->timestamps();
            
            // Un client ne peut avoir qu'une seule configuration par type d'événement
            $table->unique(['client_id', 'event_type_id']);
        });

        // Table des modèles de messages
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('content');
            $table->boolean('is_global')->default(false);
            $table->timestamps();
        });

        // Table des campagnes
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('message_content');
            $table->timestamp('scheduled_at')->nullable();
            $table->enum('status', ['draft', 'scheduled', 'sending', 'sent', 'partially_sent', 'paused', 'failed', 'cancelled'])->default('draft');
            $table->integer('recipients_count')->default(0);
            $table->integer('delivered_count')->default(0);
            $table->integer('failed_count')->default(0);
            $table->timestamps();
        });

        // Table pivot campagne-client
        Schema::create('campaign_client', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Suppression des tables d'événements et calendrier
     */
    public function down(): void
    {
        Schema::dropIfExists('campaign_client');
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('templates');
        Schema::dropIfExists('client_event_configs');
        Schema::dropIfExists('events');
        Schema::dropIfExists('event_types');
    }
};
