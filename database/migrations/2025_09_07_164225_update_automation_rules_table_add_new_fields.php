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
        Schema::table('automation_rules', function (Blueprint $table) {
            $table->dateTime('next_execution_at')->nullable()->after('last_executed_at');
            $table->integer('success_count')->default(0)->after('execution_count');
            $table->integer('failure_count')->default(0)->after('success_count');
            $table->integer('priority')->default(5)->after('failure_count'); // 1-10, 10 = highest
            $table->string('frequency')->default('once')->after('priority'); // once, daily, weekly, monthly, yearly
            $table->boolean('is_recurring')->default(false)->after('frequency');
            $table->json('tags')->nullable()->after('is_recurring');
            
            // Ajouter les nouveaux statuts si pas déjà présent
            $table->string('status')->default('active')->change();
            
            // Index pour améliorer les performances
            $table->index(['status', 'next_execution_at']);
            $table->index('priority');
            $table->index('is_recurring');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('automation_rules', function (Blueprint $table) {
            $table->dropIndex(['status', 'next_execution_at']);
            $table->dropIndex(['priority']);
            $table->dropIndex(['is_recurring']);
            
            $table->dropColumn([
                'next_execution_at',
                'success_count', 
                'failure_count',
                'priority',
                'frequency',
                'is_recurring',
                'tags'
            ]);
        });
    }
};
