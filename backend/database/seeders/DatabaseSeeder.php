<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Essential seeders for all environments (Production, Staging, Local)
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            ResourceSeeder::class,
            CategorySeeder::class,
            SettingSeeder::class,
        ]);

        // Sample dummy data (journals, articles, announcements) ONLY for Local / Staging!
        if (! app()->environment('production')) {
            $this->call([
                ContentSeeder::class,
            ]);
        }
    }
}
