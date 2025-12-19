# 🔍 Debug 500 Error - Notifications Endpoint

## 🚨 The Problem

Getting **500 Internal Server Error** on `/api/notifications` endpoint.

This is a **Laravel backend issue**, not a frontend issue.

---

## 🔍 Debug Steps

### Step 1: Check Laravel Logs

**File:** `C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log`

Look for the latest error - it will tell you exactly what's wrong.

**Common errors:**
- Missing database table
- Missing model/controller
- SQL syntax error
- Missing relationship

### Step 2: Check if Route Exists

```bash
cd C:\wamp64\www\marqconnect_backend
php artisan route:list | findstr notifications
```

Should show:
```
GET|HEAD  api/notifications  ...  NotificationController@index
GET|HEAD  api/notifications/unread-count  ...  NotificationController@unreadCount
```

### Step 3: Check if Controller Exists

**File:** `C:\wamp64\www\marqconnect_backend\app\Http\Controllers\NotificationController.php`

Should exist and have the `index()` method.

### Step 4: Check if Model Exists

**File:** `C:\wamp64\www\marqconnect_backend\app\Models\Notification.php`

Should exist and extend `Illuminate\Notifications\DatabaseNotification` or similar.

### Step 5: Check Database Table

Make sure the `notifications` table exists:

```sql
-- Run in phpMyAdmin or MySQL
SHOW TABLES LIKE 'notifications';
```

If it doesn't exist, run migrations:
```bash
php artisan migrate
```

---

## ✅ Common Fixes

### Fix 1: Missing Migration

If notifications table doesn't exist:
```bash
cd C:\wamp64\www\marqconnect_backend
php artisan notifications:table
php artisan migrate
```

### Fix 2: Missing Controller

If `NotificationController` doesn't exist, create it:
```bash
php artisan make:controller Api/NotificationController
```

### Fix 3: Missing Route

**File:** `routes/api.php`

Should have:
```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    // ... other notification routes
});
```

### Fix 4: Clear Cache

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## 🔍 What the Frontend is Doing

The frontend is correctly calling:
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count

Both are returning 500, which means the **backend is crashing**.

---

## 📝 Next Steps

1. **Check Laravel logs** (Step 1) - This will show the exact error
2. **Fix the backend issue** based on the error
3. **Clear cache** (Fix 4)
4. **Test again**

---

## 🎯 Summary

**Frontend:** ✅ Working correctly  
**Backend:** ❌ Returning 500 (check logs!)

**The error is in Laravel - check the logs to see what's wrong!** 🔍


