<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// TEMPORARY: Remove after running on production
Route::get('/run-migrations-secret', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate:fresh', [
            '--seed' => true,
            '--force' => true,
        ]);
        return "Migrations and seeders ran successfully!";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});
