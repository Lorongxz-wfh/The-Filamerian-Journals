<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_errors', function (Blueprint $table) {
            $table->id();
            $table->string('level')->default('error'); // error, critical, warning, client_error
            $table->text('message');
            $table->string('file')->nullable();
            $table->integer('line')->nullable();
            $table->string('path')->nullable();
            $table->string('method')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->longText('stack_trace')->nullable();
            $table->boolean('is_resolved')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_errors');
    }
};
