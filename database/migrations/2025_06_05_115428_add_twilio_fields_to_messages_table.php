<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTwilioFieldsToMessagesTable extends Migration
{
    public function up()
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('external_id')->nullable()->after('content'); // Twilio SID
//            $table->enum('status', ['pending', 'sent', 'delivered', 'failed', 'received'])->default('pending')->after('external_id');
            $table->string('error_code')->nullable()->after('status');
//            $table->timestamp('delivered_at')->nullable()->after('sent_at');

            $table->index('external_id');
            $table->index(['status', 'created_at']);
        });
    }

    public function down()
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['external_id', 'status', 'error_code', 'delivered_at']);
        });
    }
};
