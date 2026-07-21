<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'Filamerian@2026!'; // Raw password string; model 'hashed' cast will hash automatically

        // Super Admin User (IT)
        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@filamerian.com'],
            ['name' => 'IT Super Admin', 'password' => $password, 'is_approved' => true, 'email_verified_at' => now()]
        );
        $superAdmin->assignRole('Super Admin');

        // Admin User (Primary User)
        $admin = User::updateOrCreate(
            ['email' => 'admin@filamerian.com'],
            ['name' => 'Primary Admin', 'password' => $password, 'is_approved' => true, 'email_verified_at' => now()]
        );
        $admin->assignRole('Admin');

        // Default Admin User (If they want a default admin, though the Super Admin can create them)
        // Kept clean, just Super Admin for now
    }
}
