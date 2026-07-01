#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting Build Process ---"

# Install PHP dependencies
echo "Installing dependencies..."
composer install --no-dev --optimize-autoloader

# Run database migrations
echo "Running migrations..."
php artisan migrate --force

# Forcefully seed to update demo accounts safely without wiping DB
echo "Running seeders..."
php artisan db:seed --class=UserSeeder --force

# Optimize Laravel
echo "Optimizing..."
php artisan optimize

echo "--- Build Finished ---"
