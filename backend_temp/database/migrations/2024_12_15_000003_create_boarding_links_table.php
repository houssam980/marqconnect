<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('boarding_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('title');
            $table->text('url');
            $table->text('description')->nullable();
            $table->enum('type', ['helper', 'inspiration'])->default('helper');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['project_id', 'type']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('boarding_links');
    }
};
