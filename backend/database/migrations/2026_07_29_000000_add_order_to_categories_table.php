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
        Schema::table('categories', function (Blueprint $table) {
            $table->integer('order')->default(0)->after('description');
        });

        // Set initial order values based on ID
        $categories = \Illuminate\Support\Facades\DB::table('categories')->orderBy('id')->get();
        foreach ($categories as $index => $cat) {
            \Illuminate\Support\Facades\DB::table('categories')->where('id', $cat->id)->update(['order' => $index]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn('order');
        });
    }
};
