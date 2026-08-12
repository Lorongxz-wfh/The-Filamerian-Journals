#!/bin/bash
set -e

echo "🚀 Running Database Migrations..."
php artisan migrate --force

echo "🌱 Checking Essential Database Seeding..."
USER_COUNT=$(php artisan tinker --execute="try { echo \App\Models\User::count(); } catch (\Throwable \$e) { echo '0'; }" 2>/dev/null | tr -d '\r\n' || echo "0")

if [ "$USER_COUNT" = "0" ] || [ "$USER_COUNT" = "" ]; then
  echo "✨ Empty Database detected! Seeding essential roles, admin account, and default categories..."
  php artisan db:seed --force
fi

echo "Linking Storage..."
php artisan storage:link --force

echo "Optimizing Configuration..."
php artisan optimize:clear
php artisan optimize

echo "Starting Apache Server..."
apache2-foreground
