<?php
/**
 * LARAVEL BROADCASTING ROUTES FIX
 * 
 * Copy the appropriate code below to your Laravel routes file
 */

// ============================================
// FOR LARAVEL 10 AND BELOW
// ============================================
// File: routes/api.php
// Add this line:

use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['api', 'auth:sanctum']]);

// ============================================
// FOR LARAVEL 11
// ============================================
// File: bootstrap/app.php
// Make sure this exists in the Application configuration:

->withBroadcasting(
    __DIR__.'/../routes/channels.php',
    ['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']],
)

// ============================================
// AFTER ADDING, RUN:
// ============================================
// php artisan config:clear
// php artisan route:clear
// php artisan cache:clear
// php artisan route:list | findstr broadcasting


