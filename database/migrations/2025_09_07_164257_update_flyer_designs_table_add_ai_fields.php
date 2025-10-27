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
        Schema::table('flyer_designs', function (Blueprint $table) {
            $table->json('ai_generated_content')->nullable()->after('content');
            $table->string('business_type')->nullable()->after('ai_generated_content');
            $table->string('occasion')->nullable()->after('business_type');
            $table->json('ai_parameters')->nullable()->after('occasion');
            $table->text('ai_prompt_used')->nullable()->after('ai_parameters');
            $table->boolean('is_ai_generated')->default(false)->after('ai_prompt_used');
            $table->integer('generation_version')->default(1)->after('is_ai_generated');
            $table->json('export_settings')->nullable()->after('generation_version'); // Format, qualité, etc.
            
            $table->index('business_type');
            $table->index('occasion');
            $table->index('is_ai_generated');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flyer_designs', function (Blueprint $table) {
            $table->dropIndex(['business_type']);
            $table->dropIndex(['occasion']);
            $table->dropIndex(['is_ai_generated']);
            
            $table->dropColumn([
                'ai_generated_content',
                'business_type',
                'occasion', 
                'ai_parameters',
                'ai_prompt_used',
                'is_ai_generated',
                'generation_version',
                'export_settings'
            ]);
        });
    }
};
