#!/bin/bash
cd /tmp
sed -n "1,120p" /var/www/marqconnect/routes/api.php > api_fixed.php
echo "" >> api_fixed.php
echo "    // Clear messages endpoints" >> api_fixed.php
echo "    Route::delete('/messages/general/clear', [App\Http\Controllers\MessageController::class, 'clearGeneral']);" >> api_fixed.php
echo "    Route::delete('/messages/project-{projectId}/clear', [App\Http\Controllers\MessageController::class, 'clearProject']);" >> api_fixed.php
echo "});" >> api_fixed.php
mv api_fixed.php /var/www/marqconnect/routes/api.php
cd /var/www/marqconnect
php artisan route:clear
echo "Routes fixed!"
