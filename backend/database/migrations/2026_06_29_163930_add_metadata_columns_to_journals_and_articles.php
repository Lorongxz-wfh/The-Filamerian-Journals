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
        Schema::table('journals', function (Blueprint $table) {
            $table->string('slug')->unique()->after('title');
            $table->string('category')->nullable()->after('description');
            $table->string('issn')->nullable()->after('category');
            $table->string('frequency')->nullable()->after('issn');
            $table->string('editor')->nullable()->after('frequency');
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->string('doi')->nullable()->after('page_end');
            $table->string('status')->default('Published')->after('doi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('journals', function (Blueprint $table) {
            $table->dropColumn(['slug', 'category', 'issn', 'frequency', 'editor']);
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn(['doi', 'status']);
        });
    }
};
