#!/bin/bash
set -e

BUILD_STAMP=$(cat /var/www/html/BUILD_STAMP 2>/dev/null || echo "0")
LAST_DB_BUILD=$(php artisan tinker --execute="try { echo \App\Models\Setting::where('key', 'last_docker_build_stamp')->value('value'); } catch (\Throwable \$e) { echo 'none'; }" 2>/dev/null | tr -d '\r\n' || echo "none")

echo "🔍 Build Stamp Check -> Current Image: [${BUILD_STAMP}] | Database Recorded: [${LAST_DB_BUILD}]"

if [ "$BUILD_STAMP" != "$LAST_DB_BUILD" ] && [ "$BUILD_STAMP" != "0" ]; then
  echo "🚀 NEW DEPLOYMENT DETECTED! Running fresh migrations & seeding initial data..."
  php artisan migrate:fresh --seed --force
  php artisan tinker --execute="\App\Models\Setting::updateOrCreate(['key' => 'last_docker_build_stamp'], ['value' => '${BUILD_STAMP}']);" 2>/dev/null || true
else
  echo "💤 WAKING UP FROM SLEEP (Same Build: ${BUILD_STAMP}). Preserving existing database records!"
  php artisan migrate --force
fi

echo "Linking Storage..."
php artisan storage:link --force

echo "Optimizing Configuration..."
php artisan optimize:clear
php artisan optimize

echo "Starting Apache Server..."
apache2-foreground
