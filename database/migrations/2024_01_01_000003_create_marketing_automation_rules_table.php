<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_automation_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('trigger_type', ['birthday', 'new_client', 'inactive_client', 'seasonal', 'custom_date', 'event']);
            $table->json('trigger_conditions')->nullable();
            $table->enum('action_type', ['send_whatsapp', 'send_email', 'create_campaign', 'send_notification']);
            $table->json('action_data');
            $table->enum('status', ['active', 'inactive', 'draft'])->default('active');
            $table->boolean('use_ai')->default(false);
            $table->json('ai_settings')->nullable();
            $table->timestamp('last_executed_at')->nullable();
            $table->integer('execution_count')->default(0);
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index(['trigger_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_automation_rules');
    }
};