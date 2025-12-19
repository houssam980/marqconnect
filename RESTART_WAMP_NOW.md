# 🚨 CRITICAL: Restart WAMP NOW!

## The Problem

Laravel is configured correctly now:
- ✅ `.env` has `DB_DATABASE=marqconnect`
- ✅ Laravel cache cleared
- ✅ Config cache cleared

**BUT** Apache's PHP **OPcache** (Zend OPcache) is still holding old cached values pointing to `laravel` database.

---

## ✅ Solution: Restart WAMP Services

### Method 1: Restart All Services (RECOMMENDED)

1. **Right-click WAMP icon** (green icon in system tray - bottom right)
2. Click **"Restart All Services"**
3. Wait for icon to turn **green** again (5-10 seconds)

### Method 2: Restart Individually

1. Right-click WAMP icon
2. **Apache** → Stop
3. **MySQL** → Stop
4. Wait 5 seconds
5. **MySQL** → Start
6. **Apache** → Start

---

## ⚡ After Restarting WAMP

### 1. Hard Refresh Frontend

Press: `Ctrl + Shift + R`

### 2. Check Console

**Should work:**
- ✅ No "Unknown database 'laravel'" error
- ✅ All API endpoints return data
- ✅ Users load
- ✅ Messages load
- ✅ Projects load
- ✅ Documents load

---

## 📊 Why This Happens

**PHP OPcache** caches compiled PHP code (including configuration) in memory for performance.

When you change configuration:
- ❌ Laravel cache cleared ✅
- ❌ Config files updated ✅
- ❌ **Apache/PHP still uses OLD opcache** ⚠️

**Only way to clear Apache's opcache:** Restart Apache

---

## 🔥 DO THIS NOW:

### → Right-click WAMP icon → Restart All Services

**Then test the app!**

The error will be gone after restart. 🚀


