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
        if (Schema::hasTable('journals') && !Schema::hasColumn('journals', 'deleted_at')) {
            Schema::table('journals', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('volumes') && !Schema::hasColumn('volumes', 'deleted_at')) {
            Schema::table('volumes', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('articles') && !Schema::hasColumn('articles', 'deleted_at')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('journals') && Schema::hasColumn('journals', 'deleted_at')) {
            Schema::table('journals', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('volumes') && Schema::hasColumn('volumes', 'deleted_at')) {
            Schema::table('volumes', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('articles') && Schema::hasColumn('articles', 'deleted_at')) {
            Schema::table('articles', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
