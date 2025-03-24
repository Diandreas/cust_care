<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('plan', ['starter', 'business', 'enterprise']);
            $table->timestamp('starts_at');
            $table->timestamp('expires_at');
            $table->integer('sms_allowed');
            $table->integer('sms_used')->default(0);
            $table->integer('clients_limit');
            $table->integer('campaigns_limit');
            $table->integer('personal_sms_limit');
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
}; 