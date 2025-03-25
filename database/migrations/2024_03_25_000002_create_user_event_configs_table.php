<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_event_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('event_type_id')->constrained()->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->text('custom_template')->nullable();
            $table->integer('days_before')->default(0);
            $table->json('audience_override')->nullable();
            $table->timestamp('last_processed_at')->nullable();
            $table->timestamps();
            
            // S'assurer qu'un utilisateur n'a qu'une configuration par type d'événement
            $table->unique(['user_id', 'event_type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_event_configs');
    }
}; 