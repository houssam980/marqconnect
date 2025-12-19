#!/bin/bash
# Script to update Pusher configuration on VPS backend

echo "Updating Pusher configuration in Laravel .env file..."

cd /var/www/html

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update Pusher credentials
sed -i 's/^PUSHER_APP_ID=.*/PUSHER_APP_ID=2088769/' .env
sed -i 's/^PUSHER_APP_KEY=.*/PUSHER_APP_KEY=d0db7eef206dad3d35ba/' .env
sed -i 's/^PUSHER_APP_SECRET=.*/PUSHER_APP_SECRET=c05907ceae48e1e63c79/' .env
sed -i 's/^PUSHER_APP_CLUSTER=.*/PUSHER_APP_CLUSTER=eu/' .env
sed -i 's/^BROADCAST_DRIVER=.*/BROADCAST_DRIVER=pusher/' .env

# If the variables don't exist, add them
grep -q "^PUSHER_APP_ID=" .env || echo "PUSHER_APP_ID=2088769" >> .env
grep -q "^PUSHER_APP_KEY=" .env || echo "PUSHER_APP_KEY=d0db7eef206dad3d35ba" >> .env
grep -q "^PUSHER_APP_SECRET=" .env || echo "PUSHER_APP_SECRET=c05907ceae48e1e63c79" >> .env
grep -q "^PUSHER_APP_CLUSTER=" .env || echo "PUSHER_APP_CLUSTER=eu" >> .env
grep -q "^BROADCAST_DRIVER=" .env || echo "BROADCAST_DRIVER=pusher" >> .env

echo "✅ Pusher configuration updated!"
echo ""
echo "Current Pusher settings:"
grep -E "PUSHER|BROADCAST" .env

echo ""
echo "Clearing Laravel cache..."
php artisan config:clear
php artisan cache:clear

echo ""
echo "✅ Done! Pusher is now configured."
