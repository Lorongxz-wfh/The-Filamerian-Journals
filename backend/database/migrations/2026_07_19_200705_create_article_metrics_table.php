<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('article_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['view', 'download']);
            $table->date('date');
            $table->unsignedInteger('count')->default(1);
            $table->timestamps();
            
            $table->unique(['article_id', 'type', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_metrics');
    }
};
