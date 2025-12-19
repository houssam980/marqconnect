# ⚡ Quick Reference Card - Activity Tracking

## 🎯 What It Does
Automatically tracks when workers turn their devices on/off and shows exact time periods they're active.

---

## 👥 For Admins

### Where to Access:
**Dashboard → Equipe (Team)**

### What You See:
- 🟢 Green = Worker is online NOW
- ⚪ Gray = Worker is offline
- Live duration counter (updates automatically)
- Device info (browser + OS)

### Actions:
1. **View real-time status** - Auto-refreshes every 30 seconds
2. **Click "View History"** - See complete activity log
3. **Search/Filter** - Find specific team members

---

## 👷 For Workers

### What Happens:
- ✅ Tracking starts automatically when you open dashboard
- ✅ Nothing to click - completely automatic
- ✅ Works in background while you use the app
- ✅ Stops when you close browser

### Privacy:
- ❌ You can't see other workers' activity
- ❌ You can't manipulate your own logs
- ✅ Only admins can see tracking data

---

## 🔧 Technical Quick Facts

### Backend:
- **Endpoint**: `/api/users/activity`
- **Method**: GET
- **Auth**: Required (admin only)
- **Refresh**: Every 30 seconds

### Frontend:
- **Service**: `activityTracker.ts`
- **Component**: `EquipPage.tsx`
- **Auto-start**: Yes (in dashboard)

### Database:
- **Table**: `user_activity_logs`
- **Sessions**: Last 50 per user
- **Cleanup**: Auto (5+ min inactive)

---

## 📊 Data Captured

For Each Session:
- ✅ Login time (device on)
- ✅ Logout time (device off)
- ✅ Duration (hours:minutes)
- ✅ Device info (browser/OS)
- ✅ IP address
- ✅ Last heartbeat

---

## 🚨 Anti-Cheat Features

1. **Heartbeat System** (30 sec)
   - Can't fake activity
   - Must have app actually open
   
2. **Auto-Timeout** (5 min)
   - Closes session if no response
   - Prevents "left open" gaming
   
3. **Device Tracking**
   - Knows what device used
   - Audit trail maintained
   
4. **IP Logging**
   - Security tracking
   - Location verification

---

## ✅ Status Indicators

| Badge | Meaning | Details |
|-------|---------|---------|
| 🟢 Online | User active NOW | App is open, heartbeat detected |
| ⚪ Offline | User not active | App closed or timed out |
| Green Card | Current session | In activity history |
| Gray Card | Past session | Completed activity |

---

## 🎨 UI Elements

### Main Table Columns:
1. **Member** - Name + email
2. **Role** - User role badge
3. **Status** - Online/offline
4. **Current Session** - Active time
5. **Device** - Browser/OS
6. **Actions** - View History button

### History Dialog Shows:
- Complete timeline of all sessions
- Exact on/off times
- Duration per session
- Device used per session
- Date of each session

---

## 🔑 Key Endpoints

```
POST   /api/activity/start      - Start tracking
POST   /api/activity/heartbeat  - Keep alive
POST   /api/activity/end        - Stop tracking
GET    /api/users/activity      - Get all users
GET    /api/users/{id}/activity - Get specific user
POST   /api/activity/cleanup    - Clean stale sessions
```

---

## 💡 Tips for Admins

### Daily Monitoring:
- Check team page in morning
- See who's actually working
- Compare claimed vs actual hours

### Weekly Reviews:
- Export activity data (future feature)
- Review patterns and consistency
- Identify productivity issues

### Red Flags:
- ⚠️ Short sessions frequently
- ⚠️ Inconsistent daily hours
- ⚠️ Claims 8h but logs show 3h
- ⚠️ Different devices each day

---

## 🎉 Result

**No more time theft. Complete transparency. Automatic tracking.** 

Your workers can't game the system - activity is REAL! 💪

---

**Need Help?**
- 📄 See `ACTIVITY_TRACKING_COMPLETE.md` for full docs
- 📄 See `SETUP_CHECKLIST.md` for testing
- 📄 See `UI_VISUAL_GUIDE.md` for screenshots
