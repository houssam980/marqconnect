<?php
/**
 * ============================================
 * LARAVEL BROADCASTING ROUTES - COPY THIS
 * ============================================
 * 
 * File to edit: C:\wamp64\www\marqconnect_backend\routes\api.php
 * 
 * Add this line after the "use" statements at the top:
 */

use Illuminate\Support\Facades\Broadcast;

// Add this line in your routes/api.php file:
Broadcast::routes(['middleware' => ['api', 'auth:sanctum']]);

// ============================================
// FULL EXAMPLE OF routes/api.php:
// ============================================
/*
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

// Add this line for broadcasting/auth endpoint:
Broadcast::routes(['middleware' => ['api', 'auth:sanctum']]);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// ... rest of your routes
*/
// ============================================


