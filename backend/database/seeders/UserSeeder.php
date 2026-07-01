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
        $admin = User::firstOrCreate(
            ['email' => 'admin@filamerian.com'],
            ['name' => 'Super Admin', 'password' => $password, 'is_approved' => true, 'email_verified_at' => now()]
        );
        $admin->assignRole('Super Admin');

        // Editor User
        $editor = User::firstOrCreate(
            ['email' => 'editor@filamerian.com'],
            ['name' => 'Academic Editor', 'password' => $password, 'is_approved' => true, 'email_verified_at' => now()]
        );
        $editor->assignRole('Editor');

        // Staff User
        $staff = User::firstOrCreate(
            ['email' => 'staff@filamerian.com'],
            ['name' => 'Office Staff', 'password' => $password, 'is_approved' => true, 'email_verified_at' => now()]
        );
        $staff->assignRole('Staff');

        // Author User
        $author = User::firstOrCreate(
            ['email' => 'author@filamerian.com'],
            ['name' => 'Dr. Author Smith', 'password' => $password, 'is_approved' => true, 'email_verified_at' => now()]
        );
        $author->assignRole('Author');

        // Reviewer User
        $reviewer = User::firstOrCreate(
            ['email' => 'reviewer@filamerian.com'],
            ['name' => 'Dr. Reviewer Jones', 'password' => $password, 'is_approved' => true, 'email_verified_at' => now()]
        );
        $reviewer->assignRole('Reviewer');
    }
}
