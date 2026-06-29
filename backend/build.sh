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

# Seed the database (Optional: Only if you want to refresh seeds on every deploy)
# echo "Seeding database..."
# php artisan db:seed --force

# Optimize Laravel
echo "Optimizing..."
php artisan optimize

echo "--- Build Finished ---"
