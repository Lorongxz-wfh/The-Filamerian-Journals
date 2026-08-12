<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public bool $withinTransaction = false;

    public function up(): void
    {
        $hasFirst = Schema::hasColumn('users', 'first_name');
        $hasMiddle = Schema::hasColumn('users', 'middle_name');
        $hasLast = Schema::hasColumn('users', 'last_name');
        $hasSuffix = Schema::hasColumn('users', 'suffix');

        if (! $hasFirst || ! $hasMiddle || ! $hasLast || ! $hasSuffix) {
            Schema::table('users', function (Blueprint $table) use ($hasFirst, $hasMiddle, $hasLast, $hasSuffix) {
                if (! $hasFirst) {
                    $table->string('first_name')->nullable();
                }
                if (! $hasMiddle) {
                    $table->string('middle_name')->nullable();
                }
                if (! $hasLast) {
                    $table->string('last_name')->nullable();
                }
                if (! $hasSuffix) {
                    $table->string('suffix')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'middle_name', 'last_name', 'suffix']);
        });
    }
};
