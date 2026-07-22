#!/bin/bash
set -e

if [ "$APP_ENV" = "staging" ]; then
    echo "🧪 STAGING MODE: Running fresh migrations & dummy seeders..."
    php artisan migrate:fresh --seed --force
else
    echo "🛡️ PRODUCTION MODE: Running safe migrations (Preserving Real Production Data)..."
    php artisan migrate --force
    php artisan db:seed --class=AdminUserSeeder --force || true
fi

echo "Linking Storage..."
php artisan storage:link --force

echo "Optimizing Configuration..."
php artisan optimize:clear
php artisan optimize

echo "Starting Apache Server..."
apache2-foreground
