<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public bool $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $hasDisabled = Schema::hasColumn('users', 'is_disabled');
        $hasDisabledAt = Schema::hasColumn('users', 'disabled_at');
        $hasDeletedAt = Schema::hasColumn('users', 'deleted_at');

        if (! $hasDisabled || ! $hasDisabledAt || ! $hasDeletedAt) {
            Schema::table('users', function (Blueprint $table) use ($hasDisabled, $hasDisabledAt, $hasDeletedAt) {
                if (! $hasDisabled) {
                    $table->boolean('is_disabled')->default(false);
                }
                if (! $hasDisabledAt) {
                    $table->timestamp('disabled_at')->nullable();
                }
                if (! $hasDeletedAt) {
                    $table->softDeletes();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_disabled', 'disabled_at']);
            $table->dropSoftDeletes();
        });
    }
};
