# 🎯 User Activity Tracking System - Complete Implementation

## 📋 Overview

A comprehensive system that tracks when users' devices (PC/laptop) are turned on/off, monitors active periods, and displays detailed activity logs. This prevents workers from spamming and helps admins monitor team productivity.

## ✅ What Was Implemented

### 🗄️ Backend (Laravel)

#### 1. Database Migration
**File**: `database/migrations/2025_12_15_160000_create_user_activity_logs_table.php`
- ✅ `user_activity_logs` table created
- Fields:
  - `user_id` - Links to users table
  - `session_id` - Unique session identifier (UUID)
  - `device_info` - Browser and OS information
  - `ip_address` - User's IP address
  - `login_time` - When device/app was turned on
  - `logout_time` - When device/app was turned off (nullable)
  - `last_heartbeat` - Last activity signal received
  - `is_active` - Boolean flag for currently active sessions
- Indexes for performance optimization

#### 2. Eloquent Model
**File**: `app/Models/UserActivityLog.php`
- ✅ Model with relationships to User
- ✅ Automatic datetime casting
- ✅ Calculated attributes:
  - `duration` - Session duration in minutes
  - `time_range` - Formatted time range (HH:MM - HH:MM)

#### 3. Activity Controller
**File**: `app/Http/Controllers/ActivityController.php`
- ✅ **startSession()** - Records when user opens app (device turned on)
  - Automatically closes any previous active sessions
  - Generates unique session ID
  - Captures device info and IP address
  
- ✅ **heartbeat()** - Keeps session alive (called every 30 seconds)
  - Updates `last_heartbeat` timestamp
  - Validates session exists and is active
  
- ✅ **endSession()** - Records when user closes app (device turned off)
  - Sets `logout_time` and marks session as inactive
  
- ✅ **getUsersActivity()** - Admin-only endpoint
  - Returns all non-admin users with their activity logs
  - Shows current session, recent activity (last 50 sessions)
  - Real-time online/offline status
  
- ✅ **getUserActivity()** - Get specific user's history
  - Date range filtering supported
  - Admin-only access
  
- ✅ **cleanupStaleSessions()** - Maintenance endpoint
  - Automatically closes sessions with no heartbeat for 5+ minutes

#### 4. API Routes
**File**: `routes/api.php`
All routes protected by `auth:sanctum` middleware:
```php
Route::post('/activity/start', [ActivityController::class, 'startSession']);
Route::post('/activity/heartbeat', [ActivityController::class, 'heartbeat']);
Route::post('/activity/end', [ActivityController::class, 'endSession']);
Route::get('/users/activity', [ActivityController::class, 'getUsersActivity']);
Route::get('/users/{userId}/activity', [ActivityController::class, 'getUserActivity']);
Route::post('/activity/cleanup', [ActivityController::class, 'cleanupStaleSessions']);
```

### 🎨 Frontend (React + TypeScript)

#### 1. Activity Tracker Service
**File**: `src/services/activityTracker.ts`
- ✅ Singleton service that manages activity tracking
- ✅ **start()** - Initiates tracking when dashboard loads
  - Detects browser and OS automatically
  - Sends initial session start request
  - Starts heartbeat interval (every 30 seconds)
  
- ✅ **sendHeartbeat()** - Keeps session alive
  - Automatically restarts if session expires
  
- ✅ **stop()** - Ends session on app close
  - Uses `sendBeacon()` for reliable delivery during page unload
  - Handles `beforeunload` and `pagehide` events
  
- ✅ **Visibility change handling**
  - Pauses heartbeat when user switches tabs (optional)
  - Resumes when user returns

#### 2. Integration in Dashboard
**File**: `src/components/home.tsx`
- ✅ Automatically starts tracking when user enters dashboard
- ✅ Stops tracking when component unmounts or user logs out

#### 3. Team Activity Page (Equip Page)
**File**: `src/components/dashboard/pages/EquipPage.tsx`

**Features**:
- ✅ **Real-time team directory table**
  - Shows all non-admin users (admins are excluded from tracking)
  - Live online/offline status with green/gray badges
  - Current session information:
    - Login time (when device turned on)
    - "Now" for currently active sessions
    - Duration in hours and minutes
  - Device information (browser and OS)
  
- ✅ **Auto-refresh**
  - Updates every 30 seconds automatically
  - Shows real-time status changes
  
- ✅ **Search & Filter**
  - Search by name, email, or role
  - Pagination (8 members per page)
  
- ✅ **Activity History Dialog**
  - Click "View History" button to see complete logs
  - Shows last 50 sessions for each user
  - Each session displays:
    - ✅ Device turned on time (exact timestamp)
    - ✅ Device turned off time (exact timestamp or "Still Online")
    - ✅ Time range (HH:MM - HH:MM format)
    - ✅ Total duration (hours and minutes)
    - ✅ Device information
    - ✅ Date of session
    - ✅ Active/Ended badge
  
- ✅ **Color coding**
  - 🟢 Green = Currently active session
  - ⚪ Gray = Ended session

## 🎯 Key Features

### For Admins:
1. ✅ See all team members in one view
2. ✅ Real-time online/offline status
3. ✅ Monitor current session durations
4. ✅ View complete activity history per user
5. ✅ See exact device on/off times
6. ✅ Identify device and browser used
7. ✅ Auto-refresh every 30 seconds

### For Workers:
1. ✅ Transparent tracking - activity automatically logged
2. ✅ No manual check-in/check-out required
3. ✅ Works automatically when they open the dashboard
4. ✅ Their own activity is NOT tracked if they are admins

### System Intelligence:
1. ✅ **Automatic session management**
   - Closes old sessions when new one starts
   - Handles browser crashes/force closes
   - Cleans up stale sessions (5+ min inactive)

2. ✅ **Reliable tracking**
   - Uses heartbeat to detect if user is still active
   - `sendBeacon()` ensures end signal is sent even if browser closes suddenly
   - Handles tab switching and visibility changes

3. ✅ **Performance optimized**
   - Database indexes for fast queries
   - Limits to last 50 sessions per user
   - Auto-refresh without page reload

## 📊 Data Flow

```
1. User opens dashboard
   └→ activityTracker.start() called
   └→ POST /api/activity/start
   └→ Creates new session in database
   └→ Returns session_id

2. Every 30 seconds
   └→ POST /api/activity/heartbeat
   └→ Updates last_heartbeat timestamp

3. User closes browser/tab
   └→ beforeunload event fires
   └→ POST /api/activity/end (via sendBeacon)
   └→ Sets logout_time and is_active=false

4. Admin views team page
   └→ GET /api/users/activity
   └→ Returns all users with their sessions
   └→ Auto-refreshes every 30 seconds
```

## 🔒 Security & Privacy

- ✅ All endpoints require authentication (auth:sanctum)
- ✅ Only admins can view activity data
- ✅ Admin activity is NOT tracked (excluded from monitoring)
- ✅ IP addresses stored for security audit purposes
- ✅ Device info is general (browser/OS only, no personal data)

## 🚀 Testing Instructions

### 1. Open two browser windows:
   - **Window 1**: Login as admin
   - **Window 2**: Login as regular user (worker)

### 2. In Window 2 (Worker):
   - Navigate to dashboard
   - Check browser console - should see: "Activity tracking started: [session-id]"
   - Leave window open for a few minutes

### 3. In Window 1 (Admin):
   - Navigate to "Equipe" (Team) page
   - You should see the worker listed with:
     - 🟢 Green "Online" badge
     - Current session time (started at XX:XX - Now)
     - Duration counter
     - Device info (e.g., "Chrome on Windows")

### 4. Click "View History" on the worker:
   - Should see the current active session
   - Green background indicating active
   - "Device Turned On" time
   - "Device Turned Off" showing "Still Online"

### 5. Close Window 2 (Worker):
   - Wait 30 seconds
   - In Window 1, check the worker again
   - Status should change to ⚪ "Offline"
   - Session should show end time

### 6. Reopen Window 2 (Worker):
   - New session should start
   - Admin should see new active session

## ⚠️ Important Notes

1. **Admin accounts are NOT tracked** - This is intentional to give admins privacy
2. **30-second intervals** - Heartbeat sent every 30 seconds, refresh every 30 seconds
3. **5-minute timeout** - Sessions with no heartbeat for 5+ minutes are auto-closed
4. **Last 50 sessions** - Only most recent 50 sessions shown per user (performance)
5. **Browser compatibility** - Uses sendBeacon() (supported in all modern browsers)

## 🐛 Troubleshooting

### Activity not being tracked:
1. Check browser console for errors
2. Verify user is NOT an admin (admins excluded)
3. Ensure backend routes are accessible: `php artisan route:list | grep activity`
4. Check Laravel logs: `C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log`

### Sessions not ending properly:
1. Check if heartbeat is running (console should show requests every 30s)
2. Verify sendBeacon is supported in browser
3. Run cleanup manually: `POST /api/activity/cleanup`

### Data not showing in UI:
1. Ensure you're logged in as admin
2. Check network tab for `/api/users/activity` response
3. Verify non-admin users exist in database
4. Clear browser cache and reload

## 📁 Files Modified/Created

### Backend:
- ✅ `database/migrations/2025_12_15_160000_create_user_activity_logs_table.php`
- ✅ `app/Models/UserActivityLog.php`
- ✅ `app/Http/Controllers/ActivityController.php`
- ✅ `routes/api.php` (added 6 new routes)

### Frontend:
- ✅ `src/services/activityTracker.ts` (new)
- ✅ `src/components/home.tsx` (modified)
- ✅ `src/components/dashboard/pages/EquipPage.tsx` (completely redesigned)

## 🎉 Result

You now have a fully functional, automatic user activity tracking system that:
- ✅ Detects when devices are turned on/off
- ✅ Shows exact time periods of activity
- ✅ Monitors all workers (non-admin users)
- ✅ Provides detailed history logs
- ✅ Updates in real-time
- ✅ Prevents gaming the system with automatic heartbeat validation
- ✅ Shows professional UI with modern design

This helps you monitor your team's actual work hours and prevent time theft! 🚀
