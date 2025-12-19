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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // 'event', 'message', 'task_assigned', 'project_message'
            $table->string('title');
            $table->text('message');
            $table->string('link')->nullable(); // URL to navigate to
            $table->json('data')->nullable(); // Additional data (event_id, message_id, task_id, etc.)
            $table->boolean('read')->default(false);
            $table->timestamps();
            
            $table->index(['user_id', 'read']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
