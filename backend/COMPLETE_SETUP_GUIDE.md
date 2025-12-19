# 🚀 MarqConnect - Complete Setup Guide

## Current Status: ✅ Chat Works Without WebSocket

Your chat system is **fully functional** right now using HTTP polling (messages update every 3 seconds).

## 🎯 Two Modes Available

### Mode 1: Simple Chat (Current - No Setup Needed) ✅
- Messages saved to database
- Updates every 3 seconds via polling
- **Works immediately** - no configuration needed
- Good for development and testing

### Mode 2: Real-Time WebSocket Chat (Optional - Better for Production) 🚀
- **Instant** message delivery
- No polling, no delays
- Production-grade performance
- Requires WebSocket server setup

---

## 📋 To Enable WebSocket Mode (Optional)

### Step 1: Configure Environment

Edit `C:\wamp64\www\marqconnect_backend\.env` and add:

```env
# Broadcasting
BROADCAST_CONNECTION=reverb

# Reverb WebSocket Server
REVERB_APP_ID=1
REVERB_APP_KEY=marqconnect
REVERB_APP_SECRET=marqconnect-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080
```

### Step 2: Clear Cache

```bash
cd C:\wamp64\www\marqconnect_backend
C:\wamp64\bin\php\php8.3.28\php.exe artisan config:clear
```

### Step 3: Start WebSocket Server

```bash
cd C:\wamp64\www\marqconnect_backend
start-reverb.bat
```

OR manually:
```bash
C:\wamp64\bin\php\php8.3.28\php.exe artisan reverb:start
```

**Keep this terminal open!** The WebSocket server needs to run continuously.

### Step 4: Test

1. Open app in 2 browser windows
2. Login to both
3. Go to General Space or Project Space
4. Send a message from one window
5. See it appear **instantly** in the other! ⚡

---

## 🔧 Current Configuration

### API Endpoints (All Working ✅)

**Authentication:**
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/user` - Get current user
- `POST /api/logout` - Logout

**Tasks:**
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

**Task Statuses (Dynamic Columns):**
- `GET /api/task-statuses` - Get columns (auto-creates defaults)
- `POST /api/task-statuses` - Create new column
- `PUT /api/task-statuses/{id}` - Update column
- `DELETE /api/task-statuses/{id}` - Delete column

**Messages (Chat):**
- `GET /api/messages/{space}` - Get message history
- `GET /api/messages/{space}/new` - Get new messages (polling)
- `POST /api/messages/{space}` - Send message
- `DELETE /api/messages/{space}/{id}` - Delete message

### Chat Spaces Available
- `general` - General team chat
- `project` - Project-specific chat

---

## 🎨 Features Implemented

### Task Management ✅
- Create, update, delete tasks
- Drag & drop to change status
- Dynamic status columns (customizable per user)
- Priority levels (Low, Medium, High)
- Assignees support
- All data saved to database

### Real-Time Chat ✅
- Two chat rooms (General & Project)
- Message history loaded on mount
- Real-time updates (polling or WebSocket)
- User identification
- Timestamps
- Auto-scroll to latest
- Different styling for own messages
- Empty states

### Authentication ✅
- User registration
- Login/logout
- Token-based auth (Sanctum)
- Protected routes

---

## 🐛 Troubleshooting

### Chat not updating?
- **Without WebSocket**: Messages update every 3 seconds (this is normal)
- **With WebSocket**: Make sure Reverb server is running

### 500 Error?
- Run: `php artisan config:clear`
- Run: `php artisan optimize:clear`
- Check `storage/logs/laravel.log`

### CORS Error?
- Already configured in `config/cors.php` to allow all origins
- If still happening, restart WAMP

### Tasks not loading?
- Make sure you're logged in
- Check browser console for errors
- Verify database migrations ran: `php artisan migrate:status`

---

## 📊 Database Tables

- `users` - User accounts
- `tasks` - Task items
- `task_statuses` - Dynamic status columns
- `messages` - Chat messages
- `personal_access_tokens` - API tokens

---

## 🎉 You're All Set!

Your MarqConnect app is **fully functional** with:
- ✅ Real-time task management
- ✅ Dynamic status columns
- ✅ Working chat system (polling mode)
- ✅ Optional WebSocket upgrade available

**No additional setup required to use the app!**

For production, just follow the WebSocket setup steps above. 🚀



