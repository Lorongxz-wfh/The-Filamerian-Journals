<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('journals', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('category')->constrained('categories')->nullOnDelete();
        });

        $journals = DB::table('journals')->whereNotNull('category')->get();
        foreach ($journals as $journal) {
            $categoryName = trim($journal->category);
            if (!empty($categoryName)) {
                $category = DB::table('categories')->where('name', $categoryName)->first();
                if (!$category) {
                    $categoryId = DB::table('categories')->insertGetId([
                        'name' => $categoryName,
                        'slug' => Str::slug($categoryName),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $categoryId = $category->id;
                }
                DB::table('journals')->where('id', $journal->id)->update(['category_id' => $categoryId]);
            }
        }

        Schema::table('journals', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('journals', function (Blueprint $table) {
            $table->string('category')->nullable()->after('category_id');
        });

        $journals = DB::table('journals')->whereNotNull('category_id')->get();
        foreach ($journals as $journal) {
            $category = DB::table('categories')->where('id', $journal->category_id)->first();
            if ($category) {
                DB::table('journals')->where('id', $journal->id)->update(['category' => $category->name]);
            }
        }

        Schema::table('journals', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
    }
};
