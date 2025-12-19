# ⚠️ Backend Setup Required - Fix 500 Error

## 🚨 The Problem

The 500 error occurs because your **Laravel backend** needs to be configured for Pusher Cloud broadcasting.

---

## ✅ Quick Fix (5 Steps)

### 1. Install Pusher PHP SDK

```bash
cd C:\wamp64\www\marqconnect_backend
composer require pusher/pusher-php-server
```

### 2. Update Laravel .env

Open: `C:\wamp64\www\marqconnect_backend\.env`

Add/Update:
```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=2088769
PUSHER_APP_KEY=d0db7eef206dad3d35ba
PUSHER_APP_SECRET=c05907ceae48e1e63c79
PUSHER_APP_CLUSTER=eu
PUSHER_HOST=
PUSHER_PORT=
PUSHER_SCHEME=https
```

### 3. Clear Laravel Cache

```bash
cd C:\wamp64\www\marqconnect_backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 4. Check Broadcasting Routes

File: `C:\wamp64\www\marqconnect_backend\routes\channels.php`

Should contain:
```php
<?php

use Illuminate\Support\Facades\Broadcast;

// Public channels (no auth needed)
Broadcast::channel('chat.general', function ($user) {
    return ['id' => $user->id, 'name' => $user->name];
});

Broadcast::channel('chat.project-{projectId}', function ($user, $projectId) {
    return ['id' => $user->id, 'name' => $user->name];
});

// Private user notifications
Broadcast::channel('private-user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
```

### 5. Restart Everything

```bash
# Frontend
npm run dev

# Make sure WAMP is running
```

---

## 🔍 Verify It Works

1. Open: `http://localhost:5173`
2. Check browser console (F12)
3. Should see: `✅ Connected to Pusher Cloud`
4. No more 500 errors!

---

## 🆘 Still Getting 500?

Check Laravel logs:
```
C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log
```

Common issues:
- ❌ Missing `pusher/pusher-php-server` → Run `composer require pusher/pusher-php-server`
- ❌ Wrong credentials in .env → Double-check all values
- ❌ Cache not cleared → Run all `artisan *:clear` commands
- ❌ Routes not set up → Check `routes/channels.php` exists

---

## 📝 Checklist

- [ ] Installed `pusher/pusher-php-server`
- [ ] Updated `.env` with Pusher credentials
- [ ] Cleared all Laravel caches
- [ ] Checked `routes/channels.php` exists
- [ ] Restarted frontend dev server
- [ ] Tested in browser

---

**After these steps, the 500 error should be gone!** 🚀


