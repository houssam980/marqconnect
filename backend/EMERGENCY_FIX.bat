@echo off
echo ========================================
echo MarqConnect - Emergency Fix
echo ========================================
echo.

echo Step 1: Clearing all caches...
C:\wamp64\bin\php\php8.3.28\php.exe artisan clear-compiled
C:\wamp64\bin\php\php8.3.28\php.exe artisan cache:clear
C:\wamp64\bin\php\php8.3.28\php.exe artisan config:clear
C:\wamp64\bin\php\php8.3.28\php.exe artisan route:clear
C:\wamp64\bin\php\php8.3.28\php.exe artisan view:clear

echo.
echo Step 2: Testing API...
curl -s http://localhost/marqconnect_backend/public/debug.php

echo.
echo ========================================
echo Done! Now test in browser:
echo http://localhost:5173
echo ========================================
pause



