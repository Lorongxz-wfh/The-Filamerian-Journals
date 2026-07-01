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
            ['name' => 'Super Admin', 'password' => $password]
        );
        $admin->assignRole('Super Admin');

        // Editor User
        $editor = User::firstOrCreate(
            ['email' => 'editor@filamerian.com'],
            ['name' => 'Academic Editor', 'password' => $password]
        );
        $editor->assignRole('Editor');

        // Staff User
        $staff = User::firstOrCreate(
            ['email' => 'staff@filamerian.com'],
            ['name' => 'Office Staff', 'password' => $password]
        );
        $staff->assignRole('Staff');

        // Author User
        $author = User::firstOrCreate(
            ['email' => 'author@filamerian.com'],
            ['name' => 'Dr. Author Smith', 'password' => $password]
        );
        $author->assignRole('Author');

        // Reviewer User
        $reviewer = User::firstOrCreate(
            ['email' => 'reviewer@filamerian.com'],
            ['name' => 'Dr. Reviewer Jones', 'password' => $password]
        );
        $reviewer->assignRole('Reviewer');
    }
}
