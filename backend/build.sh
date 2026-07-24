#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting Build Process ---"

# Install PHP dependencies
echo "Installing dependencies..."
composer install --no-dev --optimize-autoloader

# Run database migrations
echo "Running migrations: php artisan migrate:fresh --seed --force..."
php artisan migrate:fresh --seed --force

# Create storage symlink
echo "Linking storage..."
php artisan storage:link --force

# Optimize Laravel
echo "Optimizing..."
php artisan optimize

echo "--- Build Finished ---"
