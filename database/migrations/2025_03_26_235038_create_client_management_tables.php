<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Création des tables pour la gestion des clients
     */
    public function up(): void
    {
        // Table des clients
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('phone')->index();
            $table->string('email')->nullable();
            $table->date('birthday')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Table des tags
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->string('color')->default('#6B7280');
            $table->timestamps();
        });

        // Table pivot client-tag
        Schema::create('client_tag', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('tag_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        // Table des visites client
        Schema::create('visits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('visit_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Table des messages (SMS/WhatsApp)
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('campaign_id')->nullable()->constrained()->onDelete('set null');
            $table->text('content');
            $table->enum('status', ['pending', 'sent', 'delivered', 'failed'])->default('pending');
            $table->boolean('is_reply')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });

        // Table des messages Twilio
        Schema::create('twilio_messages', function (Blueprint $table) {
            $table->id();
            $table->string('twilio_sid')->unique();
            $table->foreignId('message_id')->nullable()->constrained()->onDelete('set null');
            $table->string('from_number');
            $table->string('to_number');
            $table->text('content');
            $table->string('status');
            $table->json('response_data')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Suppression des tables de gestion des clients
     */
    public function down(): void
    {
        Schema::dropIfExists('twilio_messages');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('visits');
        Schema::dropIfExists('client_tag');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('clients');
    }
};