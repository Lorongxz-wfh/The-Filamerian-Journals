#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- Starting Build Process ---"

# Install PHP dependencies
echo "Installing dependencies..."
composer install --no-dev --optimize-autoloader

# Run database migrations
echo "Running migrations for APP_ENV=${APP_ENV}..."
if [ "$APP_ENV" = "production" ] || [ "$APP_ENV" = "prod" ]; then
    echo "Running production migration: php artisan migrate:fresh --force"
    php artisan migrate:fresh --force
else
    echo "Running dev/staging migration: php artisan migrate:fresh --seed --force"
    php artisan migrate:fresh --seed --force
fi

# Create storage symlink
echo "Linking storage..."
php artisan storage:link --force

# Optimize Laravel
echo "Optimizing..."
php artisan optimize

echo "--- Build Finished ---"
