#!/bin/bash
cd /tmp
# Get lines 1-120 (before the closing brace)
sed -n "1,120p" /var/www/marqconnect/routes/api.php > api_fixed.php
# Add the new routes
echo "" >> api_fixed.php
echo "    // Clear messages endpoints" >> api_fixed.php
echo "    Route::delete('/messages/general/clear', [App\Http\Controllers\MessageController::class, 'clearGeneral']);" >> api_fixed.php
echo "    Route::delete('/messages/project-{projectId}/clear', [App\Http\Controllers\MessageController::class, 'clearProject']);" >> api_fixed.php
# Add the closing brace
echo "});" >> api_fixed.php
# Copy to the actual location
cp api_fixed.php /var/www/marqconnect/routes/api.php
# Clear cache and test
cd /var/www/marqconnect
php artisan route:clear
echo "Checking if routes exist:"
php artisan route:list | grep -i "messages.*clear" || echo "Routes not found in list"
echo "Done!"
