<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_flyers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('format', ['a4', 'a5', 'square', 'story', 'post']);
            $table->enum('orientation', ['portrait', 'landscape'])->default('portrait');
            $table->json('design_data');
            $table->json('content_data');
            $table->json('ai_generated_content')->nullable();
            $table->string('template_name')->nullable();
            $table->json('export_settings')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();
            
            $table->index(['user_id', 'format', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_flyers');
    }
};