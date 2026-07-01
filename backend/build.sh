#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting Build Process ---"

# Install PHP dependencies
echo "Installing dependencies..."
composer install --no-dev --optimize-autoloader

# Run database migrations and SEED freshly
echo "Running migrations and seeding freshly..."
php artisan migrate:fresh --seed --force

# Optimize Laravel
echo "Optimizing..."
php artisan optimize

echo "--- Build Finished ---"
