<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flyers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->nullable()->constrained('content_templates')->onDelete('set null');
            $table->string('title');
            $table->json('design_data');
            $table->enum('format', ['a4', 'a5', 'square', 'story', 'post'])->default('square');
            $table->enum('status', ['draft', 'completed', 'archived'])->default('draft');
            $table->boolean('ai_generated')->default(false);
            $table->integer('download_count')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['format']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flyers');
    }
};