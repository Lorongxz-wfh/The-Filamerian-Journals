<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Undergraduate',
            'Graduate School',
            'Institutional',
            'Multidisciplinary'
        ];

        foreach ($categories as $index => $cat) {
            Category::firstOrCreate(
                ['name' => $cat],
                ['slug' => Str::slug($cat), 'order' => $index]
            );
        }
    }
}
