<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password'); // Default password for all dummy accounts

        // Super Admin User
        $admin = User::updateOrCreate(
            ['email' => 'admin@filamerian.com'],
            ['name' => 'Super Admin', 'password' => $password, 'is_approved' => true, 'email_verified_at' => now()]
        );
        $admin->assignRole('Super Admin');

        // Default Admin User (If they want a default admin, though the Super Admin can create them)
        // Kept clean, just Super Admin for now
    }
}
