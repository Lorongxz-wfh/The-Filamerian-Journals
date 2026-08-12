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
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@filamerian.com'],
            [
                'name' => 'IT Super Admin',
                'first_name' => 'IT Super',
                'middle_name' => null,
                'last_name' => 'Admin',
                'suffix' => null,
                'password' => $password,
                'is_approved' => true,
                'email_verified_at' => now()
            ]
        );
        if (! $superAdmin->hasRole('Super Admin')) {
            $superAdmin->assignRole('Super Admin');
        }

        // Admin User (Primary User)
        $admin = User::firstOrCreate(
            ['email' => 'admin@filamerian.com'],
            [
                'name' => 'Admin User',
                'first_name' => 'Admin',
                'middle_name' => null,
                'last_name' => 'User',
                'suffix' => null,
                'password' => $password,
                'is_approved' => true,
                'email_verified_at' => now()
            ]
        );
        if (! $admin->hasRole('Admin')) {
            $admin->assignRole('Admin');
        }

        // Default Admin User (If they want a default admin, though the Super Admin can create them)
        // Kept clean, just Super Admin for now
    }
}
