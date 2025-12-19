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
        if (!Schema::hasColumn('messages', 'document_id')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->foreignId('document_id')->nullable()->after('content')->constrained('documents')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('messages', 'document_id')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->dropForeign(['document_id']);
                $table->dropColumn('document_id');
            });
        }
    }
};
