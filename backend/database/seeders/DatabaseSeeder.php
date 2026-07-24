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
        $seeders = [
            RoleSeeder::class,
            UserSeeder::class,
            ResourceSeeder::class,
        ];

        // Only seed sample journals, volumes, articles in Dev / Staging
        if (app()->environment('local', 'dev', 'staging', 'testing') || env('APP_ENV') !== 'production') {
            $seeders[] = ContentSeeder::class;
        }

        $this->call($seeders);
    }
}
