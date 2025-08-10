<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automation_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('trigger_type', ['birthday', 'anniversary', 'seasonal', 'inactivity', 'new_client', 'purchase']);
            $table->json('trigger_conditions');
            $table->enum('action_type', ['send_sms', 'send_email', 'send_whatsapp', 'create_reminder', 'add_tag']);
            $table->json('action_data');
            $table->enum('status', ['active', 'inactive', 'paused'])->default('active');
            $table->integer('delay_hours')->default(0);
            $table->timestamp('last_executed_at')->nullable();
            $table->integer('execution_count')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['trigger_type']);
            $table->index(['last_executed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automation_rules');
    }
};