<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
class AddOptOutToClientsTable extends Migration
{
    public function up()
    {
        Schema::table('clients', function (Blueprint $table) {
            if (!Schema::hasColumn('clients', 'opt_out')) {
                $table->boolean('opt_out')->default(false)->after('phone');
                $table->timestamp('opt_out_date')->nullable()->after('opt_out');
            }
        });
    }

    public function down()
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['opt_out', 'opt_out_date']);
        });
    }
}
