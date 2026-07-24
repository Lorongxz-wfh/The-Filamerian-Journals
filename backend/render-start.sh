#!/bin/bash
set -e

if [ "$APP_ENV" = "production" ] || [ "$APP_ENV" = "prod" ]; then
    echo "🛡️ PRODUCTION MODE: Running fresh migrations without dummy content..."
    php artisan migrate:fresh --force
else
    echo "🧪 DEV/STAGING MODE: Running fresh migrations & seeding all sample content..."
    php artisan migrate:fresh --seed --force
fi

echo "Linking Storage..."
php artisan storage:link --force

echo "Optimizing Configuration..."
php artisan optimize:clear
php artisan optimize

echo "Starting Apache Server..."
apache2-foreground
