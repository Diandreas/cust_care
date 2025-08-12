<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_content_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['post', 'article', 'message', 'flyer', 'email']);
            $table->text('content_structure');
            $table->json('variables')->nullable();
            $table->json('default_values')->nullable();
            $table->json('platforms')->nullable();
            $table->enum('tone', ['professional', 'casual', 'friendly', 'formal', 'creative'])->default('professional');
            $table->json('ai_settings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['user_id', 'type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_content_templates');
    }
};