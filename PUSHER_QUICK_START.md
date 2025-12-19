# ⚡ Pusher Cloud - Quick Start

## 🚀 5-Minute Setup

### 1. Get Pusher Credentials
- Go to [https://dashboard.pusher.com/](https://dashboard.pusher.com/)
- Create an app (or use existing)
- Copy: **Key**, **Secret**, **App ID**, **Cluster**

### 2. Frontend Setup
Create `.env` in project root:
```env
VITE_PUSHER_APP_KEY=your_key_here
VITE_PUSHER_CLUSTER=us2
VITE_PUSHER_AUTH_ENDPOINT=http://localhost/marqconnect_backend/public/broadcasting/auth
```

### 3. Backend Setup
Update Laravel `.env`:
```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_key
PUSHER_APP_SECRET=your_secret
PUSHER_APP_CLUSTER=us2
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
```

### 4. Clear Cache & Restart
```bash
# Backend
php artisan config:clear

# Frontend - restart dev server
npm run dev
```

### 5. Test
- Open app in 2 browser windows
- Send a message
- Should appear instantly in both! ✅

---

## ✅ What's Working Now

- ✅ Real-time notifications
- ✅ Real-time chat (General & Project)
- ✅ Real-time task updates
- ✅ Real-time event notifications

**No local WebSocket server needed!** Pusher Cloud handles everything.

---

## 📖 Full Guide

See `PUSHER_CLOUD_SETUP.md` for detailed instructions and troubleshooting.


