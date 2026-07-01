#!/bin/bash
set -e

echo "Running Database Migrations & Seeders..."
php artisan migrate:fresh --seed --force

echo "Optimizing Configuration..."
php artisan optimize:clear
php artisan optimize

echo "Starting Apache Server..."
apache2-foreground
