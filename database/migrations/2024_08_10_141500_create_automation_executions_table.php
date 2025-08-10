<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('automation_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('automation_rule_id')->constrained()->onDelete('cascade');
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['pending', 'executed', 'failed', 'skipped'])->default('pending');
            $table->timestamp('executed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('result_data')->nullable();
            $table->timestamps();

            $table->index(['automation_rule_id', 'status']);
            $table->index(['client_id']);
            $table->index(['executed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automation_executions');
    }
};