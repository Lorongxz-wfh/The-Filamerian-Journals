#!/bin/bash
set -e

echo "🚀 Running fresh database migrations & seeders..."
php artisan migrate:fresh --seed --force

echo "Linking Storage..."
php artisan storage:link --force

echo "Optimizing Configuration..."
php artisan optimize:clear
php artisan optimize

echo "Starting Apache Server..."
apache2-foreground
