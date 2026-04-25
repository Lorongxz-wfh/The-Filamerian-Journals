<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create roles
        Role::create(['name' => 'Super Admin']);
        Role::create(['name' => 'Editor']);
        Role::create(['name' => 'Staff']);

        // Create a Super Admin user
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@filamerian.com',
            'password' => Hash::make('password'), // Change this in production
        ]);

        $admin->assignRole('Super Admin');
    }
}
