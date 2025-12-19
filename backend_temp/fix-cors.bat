@echo off
echo ========================================
echo Fixing CORS Issues
echo ========================================
echo.

echo Step 1: Clearing Laravel caches...
C:\wamp64\bin\php\php8.3.28\php.exe artisan config:clear
C:\wamp64\bin\php\php8.3.28\php.exe artisan cache:clear
C:\wamp64\bin\php\php8.3.28\php.exe artisan route:clear

echo.
echo Step 2: Testing API endpoint...
curl -v http://localhost/marqconnect_backend/public/api/user

echo.
echo ========================================
echo Done! Now restart WAMP and test again.
echo ========================================
pause



