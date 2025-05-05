<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Création des tables pour les abonnements et transactions
     */
    public function up(): void
    {
        // Table des plans d'abonnement
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('price', 10, 2);
            $table->enum('billing_period', ['monthly', 'yearly'])->default('monthly');
            $table->integer('max_clients');
            $table->integer('monthly_messages');
            $table->integer('monthly_campaigns');
            $table->boolean('advanced_analytics')->default(false);
            $table->boolean('custom_templates')->default(false);
            $table->text('features')->nullable(); // JSON des fonctionnalités formatées pour affichage
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });

        // Table des abonnements
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained()->onDelete('restrict');
            $table->string('status');
            $table->timestamp('started_at');
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->boolean('auto_renew')->default(true);
            $table->timestamps();
        });

        // Table des transactions
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('subscription_id')->nullable()->constrained()->onDelete('set null');
            $table->string('transaction_id')->unique()->nullable();
            $table->string('payment_method')->nullable();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('EUR');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // Table des transactions en attente
        Schema::create('pending_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('EUR');
            $table->string('payment_intent_id')->nullable()->unique();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // Table des soldes SMS par utilisateur
        Schema::create('sms_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->integer('balance')->default(0);
            $table->integer('consumed')->default(0);
            $table->timestamp('reset_date')->nullable();
            $table->timestamps();
        });

        // Table des achats de crédits SMS supplémentaires
        Schema::create('sms_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            $table->integer('quantity');
            $table->decimal('unit_price', 8, 4);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Suppression des tables d'abonnement
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_purchases');
        Schema::dropIfExists('sms_balances');
        Schema::dropIfExists('pending_transactions');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
    }
};