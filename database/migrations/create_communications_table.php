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
        Schema::create('communications', function (Blueprint $table) {
            $table->id();
            $table->string('to')->nullable();
            $table->string('from')->nullable();
            $table->text('content')->nullable();
            $table->text('response')->nullable();
            $table->string('channel')->comment('sms, whatsapp, voice, email');
            $table->string('direction')->comment('inbound, outbound');
            $table->string('external_id')->nullable()->comment('ID du message chez Twilio');
            $table->foreignId('campaign_id')->nullable()->constrained()->onDelete('set null');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('communications');
    }
}; 