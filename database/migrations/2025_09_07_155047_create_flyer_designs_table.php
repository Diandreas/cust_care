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
        Schema::create('flyer_designs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('template_id')->nullable();
            $table->string('name');
            $table->enum('format', ['A4', 'A5', 'square', 'story', 'post']);
            $table->enum('layout', ['classic', 'modern', 'minimal']);
            $table->json('elements'); // Design elements (text, images, shapes)
            $table->json('content')->nullable(); // Generated content by AI
            $table->string('background_color')->default('#FFFFFF');
            $table->string('primary_color')->default('#0066FF');
            $table->string('text_color')->default('#000000');
            $table->json('fonts')->nullable(); // Font choices
            $table->string('export_format')->default('PNG'); // PNG, JPG, PDF
            $table->string('file_path')->nullable(); // Generated file path
            $table->boolean('is_template')->default(false);
            $table->timestamps();
            
            $table->index(['user_id', 'format']);
            $table->index(['is_template']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flyer_designs');
    }
};
