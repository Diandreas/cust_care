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
        Schema::create('whatsapp_auth_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('phone_number');
            $table->string('pin_code', 6);
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('expires_at');
            $table->string('session_token')->nullable();
            $table->json('session_data')->nullable(); // Additional session info
            $table->integer('attempts')->default(0);
            $table->boolean('is_blocked')->default(false);
            $table->timestamp('blocked_until')->nullable();
            $table->timestamps();
            
            $table->index(['phone_number']);
            $table->index(['pin_code']);
            $table->index(['session_token']);
            $table->index(['expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_auth_sessions');
    }
};
