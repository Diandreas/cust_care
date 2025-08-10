<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->nullable()->constrained('content_templates')->onDelete('set null');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->boolean('ai_generated')->default(false);
            $table->integer('reading_time')->nullable();
            $table->integer('view_count')->default(0);
            $table->integer('seo_score')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['published_at']);
            $table->index(['slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};