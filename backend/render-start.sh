#!/bin/bash
set -e

echo "🚀 Running Database Migrations..."
php artisan migrate --force

echo "🌱 Seeding Essential Data (Roles, Admin User & Categories)..."
php artisan db:seed --force

echo "Linking Storage..."
php artisan storage:link --force

echo "Optimizing Configuration..."
php artisan optimize:clear
php artisan optimize

echo "Starting Apache Server..."
apache2-foreground
