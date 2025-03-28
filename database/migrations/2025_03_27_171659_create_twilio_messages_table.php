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
        Schema::create('twilio_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('twilio_sid')->nullable();
            $table->string('from');
            $table->string('to');
            $table->text('body');
            $table->string('media_url')->nullable();
            $table->string('status')->default('queued');
            $table->string('direction')->default('outbound-api');
            $table->json('error_info')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('twilio_messages');
    }
};
