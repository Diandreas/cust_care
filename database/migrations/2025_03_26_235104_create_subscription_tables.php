<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Création des tables pour la gestion des abonnements et transactions
     */
    public function up(): void
    {
        // Table des plans d'abonnement
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->decimal('price', 10, 2);
            $table->decimal('annual_price', 10, 2)->nullable();
            $table->boolean('has_annual_option')->default(false);
            $table->integer('annual_discount_percent')->default(0);
            $table->integer('max_clients');
            $table->integer('max_campaigns_per_month');
            $table->integer('total_campaign_sms');
            $table->integer('monthly_sms_quota');
            $table->decimal('unused_sms_rollover_percent', 5, 2)->default(0);
            $table->text('description')->nullable();
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Table des abonnements
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->enum('plan', ['starter', 'business', 'enterprise']);
            $table->timestamp('starts_at');
            $table->timestamp('expires_at');
            $table->integer('clients_limit');
            $table->integer('campaigns_limit');
            $table->integer('campaign_sms_limit')->default(0);
            $table->integer('personal_sms_quota')->default(0);
            $table->integer('sms_used')->default(0);
            $table->integer('campaigns_used')->default(0);
            $table->date('next_renewal_date')->nullable();
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->enum('duration', ['monthly', 'annual'])->default('monthly');
            $table->boolean('is_auto_renew')->default(true);
            $table->json('features')->nullable();
            $table->timestamps();
        });

        // Table des transactions
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->enum('type', ['subscription', 'addon', 'refund'])->default('subscription');
            $table->enum('status', ['completed', 'pending', 'failed'])->default('pending');
            $table->string('reference')->nullable(); // External payment reference
            $table->json('metadata')->nullable(); // Additional data about the transaction
            $table->timestamps();
        });
    }

    /**
     * Suppression des tables d'abonnement
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('subscription_plans');
    }
};