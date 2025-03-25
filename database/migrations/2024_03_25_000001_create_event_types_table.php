<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('category', ['personal', 'calendar', 'marketing', 'recurring']);
            $table->text('default_template');
            $table->boolean('is_global')->default(true);
            $table->enum('date_type', ['fixed_date', 'dynamic_date', 'client_field']);
            $table->json('date_parameters')->nullable();
            $table->enum('audience_logic', ['all', 'male', 'female', 'specific_tags', 'specific_category']);
            $table->json('audience_parameters')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_types');
    }
}; 