<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCommunicationsTable extends Migration
{
    public function up()
    {
        Schema::create('communications', function (Blueprint $table) {
            $table->id();
            $table->string('from');
            $table->string('to');
            $table->text('content');
            $table->text('response')->nullable();
            $table->enum('channel', ['sms', 'whatsapp', 'voice', 'email']);
            $table->enum('direction', ['inbound', 'outbound']);
            $table->string('external_id')->nullable(); // Twilio SID
            $table->foreignId('campaign_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamps();

            $table->index(['channel', 'direction']);
            $table->index('created_at');
            $table->index('external_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('communications');
    }
}
