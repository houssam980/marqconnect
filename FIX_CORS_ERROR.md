# 🔧 Fix CORS Error - Broadcasting Auth

## 🚨 The Problem

You're getting this error:
```
Access to XMLHttpRequest at 'http://localhost/marqconnect_backend/public/broadcasting/auth' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

This means your **Laravel backend** is blocking requests from your frontend.

---

## ✅ Solution: Configure CORS in Laravel

### Step 1: Install Laravel CORS Package (if not installed)

```bash
cd C:\wamp64\www\marqconnect_backend
composer require fruitcake/laravel-cors
```

### Step 2: Publish CORS Config

```bash
php artisan config:publish cors
```

### Step 3: Update CORS Configuration

**File:** `C:\wamp64\www\marqconnect_backend\config\cors.php`

Update it to:
```php
<?php

return [
    'paths' => ['api/*', 'broadcasting/auth', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
```

### Step 4: Enable CORS Middleware

**File:** `C:\wamp64\www\marqconnect_backend\bootstrap\app.php`

Make sure `HandleCors` middleware is enabled. It should look like:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->api(prepend: [
        \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
    ]);

    $middleware->validateCsrfTokens(except: [
        'broadcasting/auth',
    ]);
})
```

**OR if using `app/Http/Kernel.php` (Laravel 10 and below):**

Add to `$middlewareGroups['api']`:
```php
\Fruitcake\Cors\HandleCors::class,
```

### Step 5: Update .htaccess (if using Apache/WAMP)

**File:** `C:\wamp64\www\marqconnect_backend\public\.htaccess`

Make sure it doesn't have conflicting CORS headers. It should look like:
```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect Trailing Slashes If Not A Folder...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} (.+)/$
    RewriteRule ^ %1 [L,R=301]

    # Send Requests To Front Controller...
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
```

**DO NOT add CORS headers here** - Let Laravel handle it!

### Step 6: Clear All Caches

```bash
cd C:\wamp64\www\marqconnect_backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### Step 7: Restart WAMP/Apache

Restart your WAMP server to apply changes.

---

## 🔍 Alternative: Quick Fix with .htaccess (Temporary)

If the above doesn't work, you can temporarily add CORS headers to `.htaccess`:

**File:** `C:\wamp64\www\marqconnect_backend\public\.htaccess`

Add at the top (before `<IfModule mod_rewrite.c>`):
```apache
# CORS Headers
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "http://localhost:5173"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, Accept, X-Requested-With"
    Header set Access-Control-Allow-Credentials "true"
</IfModule>
```

**⚠️ Note:** This is a temporary fix. The proper way is using Laravel CORS package.

---

## ✅ Verify It Works

1. **Restart WAMP**
2. **Clear Laravel cache** (see Step 6)
3. **Refresh browser** (Hard refresh: `Ctrl+Shift+R`)
4. **Check browser console** - CORS error should be gone!

---

## 🆘 Still Not Working?

### Check 1: Verify CORS Package is Installed
```bash
composer show | grep cors
```

### Check 2: Check Laravel Logs
```
C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log
```

### Check 3: Test Broadcasting Endpoint Directly

Open browser console and run:
```javascript
fetch('http://localhost/marqconnect_backend/public/broadcasting/auth', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    socket_id: '123.456',
    channel_name: 'private-user.1'
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

---

## 📝 Summary

**The issue:** Laravel backend is blocking CORS requests from frontend.

**The fix:** 
1. Install `fruitcake/laravel-cors`
2. Configure `config/cors.php`
3. Enable CORS middleware
4. Clear cache
5. Restart WAMP

**After this, the CORS error will be gone!** 🎉


