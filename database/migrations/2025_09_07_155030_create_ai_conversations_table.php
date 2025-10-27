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
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->nullable()->constrained()->onDelete('set null');
            $table->string('platform')->default('web'); // web, whatsapp
            $table->string('session_id')->nullable();
            $table->json('messages'); // Array of conversation messages
            $table->enum('status', ['active', 'ended', 'archived'])->default('active');
            $table->json('context')->nullable(); // Additional context data
            $table->timestamp('last_activity_at');
            $table->timestamps();
            
            $table->index(['user_id', 'platform']);
            $table->index(['session_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_conversations');
    }
};
