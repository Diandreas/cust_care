<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['post', 'article', 'flyer', 'email', 'sms', 'whatsapp']);
            $table->enum('category', ['promotional', 'educational', 'entertainment', 'announcement', 'seasonal']);
            $table->text('content_structure');
            $table->json('variables')->nullable();
            $table->json('default_values')->nullable();
            $table->text('ai_prompt')->nullable();
            $table->boolean('is_public')->default(false);
            $table->integer('usage_count')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['category']);
            $table->index(['is_public']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_templates');
    }
};