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
        Schema::create('generated_contents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['social_post', 'article', 'message', 'flyer_content', 'email']);
            $table->string('platform')->nullable(); // facebook, instagram, linkedin, twitter
            $table->string('topic');
            $table->text('content');
            $table->json('parameters')->nullable(); // tone, audience, keywords, etc.
            $table->text('prompt_used')->nullable();
            $table->boolean('is_used')->default(false);
            $table->integer('character_count')->default(0);
            $table->integer('word_count')->default(0);
            $table->timestamps();
            
            $table->index(['user_id', 'type']);
            $table->index(['platform']);
            $table->index(['is_used']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_contents');
    }
};
