#!/bin/bash
set -e

echo "Running Database Migrations..."
php artisan migrate --force

echo "Optimizing Configuration..."
php artisan optimize:clear
php artisan optimize

echo "Starting Apache Server..."
apache2-foreground
