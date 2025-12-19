# 📋 Laravel Logs Analysis & Fixes

## 📍 Log File Location

**Path:** `C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log`

---

## 🚨 Errors Found

### Error 1: Missing Database Table ⚠️ **CRITICAL**

**Error:**
```
SQLSTATE[HY000]: General error: 1 no such table: personal_access_tokens
```

**Cause:**
- The `personal_access_tokens` table doesn't exist in the database
- This table is required for Laravel Sanctum authentication
- Without it, all authenticated API requests will fail with 500 errors

**Impact:**
- ❌ All API endpoints requiring authentication fail
- ❌ Users cannot log in or access protected routes
- ❌ Token-based authentication doesn't work

**Fix:**
```bash
cd C:\wamp64\www\marqconnect_backend
php artisan migrate
```

This will run all pending migrations, including creating the `personal_access_tokens` table.

---

### Error 2: File Permission Issue

**Error:**
```
rename(C:\wamp64\www\marqconnect_backend\bootstrap\cache\pac10FF.tmp,...): Accès refusé (code: 5)
```

**Cause:**
- Laravel cannot write to the `bootstrap/cache` directory
- File permission issue on Windows

**Impact:**
- ⚠️ Cache files cannot be updated
- ⚠️ May cause slower performance
- ⚠️ Not critical for API functionality

**Fix:**
1. **Option 1: Clear cache manually**
   ```bash
   cd C:\wamp64\www\marqconnect_backend
   php artisan config:clear
   php artisan cache:clear
   ```

2. **Option 2: Fix permissions**
   - Right-click `bootstrap/cache` folder
   - Properties → Security → Edit
   - Give "Full control" to the web server user (usually `IUSR` or `IIS_IUSRS`)

---

### Error 3: View Class Not Found

**Error:**
```
Target class [view] does not exist
```

**Cause:**
- This is a cascading error from Error 1
- When the database query fails, Laravel tries to render an error view
- The view system isn't properly configured (API-only app)

**Impact:**
- ⚠️ Error pages cannot be rendered
- ✅ Not critical - API endpoints still work
- ✅ This error disappears once Error 1 is fixed

**Fix:**
- This will be resolved automatically once Error 1 is fixed
- No action needed

---

## ✅ Priority Fixes

### **Priority 1: Run Database Migrations** 🔴 **CRITICAL**

This is the most important fix - it will resolve most 500 errors:

```bash
cd C:\wamp64\www\marqconnect_backend
C:\wamp64\bin\php\php8.3.28\php.exe artisan migrate
```

**What this does:**
- Creates all missing database tables
- Creates `personal_access_tokens` table (for authentication)
- Creates all other required tables (users, tasks, projects, etc.)

**After running:**
- ✅ All API endpoints should work
- ✅ Authentication will work
- ✅ Most 500 errors will be resolved

---

### **Priority 2: Clear Cache** 🟡 **IMPORTANT**

After running migrations, clear the cache:

```bash
cd C:\wamp64\www\marqconnect_backend
C:\wamp64\bin\php\php8.3.28\php.exe artisan config:clear
C:\wamp64\bin\php\php8.3.28\php.exe artisan route:clear
C:\wamp64\bin\php\php8.3.28\php.exe artisan cache:clear
```

**What this does:**
- Clears cached configuration
- Clears cached routes
- Clears application cache
- Ensures all changes are applied

---

## 📝 Quick Fix Script

Create a file `fix-database.ps1` in the backend directory:

```powershell
# Fix Database and Cache
Write-Host "Running database migrations..." -ForegroundColor Yellow

$phpPath = "C:\wamp64\bin\php\php8.3.28\php.exe"
$backendDir = "C:\wamp64\www\marqconnect_backend"

Set-Location $backendDir

# Run migrations
Write-Host "`nCreating database tables..." -ForegroundColor Cyan
& $phpPath artisan migrate --force

# Clear cache
Write-Host "`nClearing cache..." -ForegroundColor Cyan
& $phpPath artisan config:clear
& $phpPath artisan route:clear
& $phpPath artisan cache:clear

Write-Host "`n✅ Database and cache fixed!" -ForegroundColor Green
```

Run it:
```powershell
cd C:\wamp64\www\marqconnect_backend
.\fix-database.ps1
```

---

## 🔍 How to Check Logs

### View Latest Errors:
```powershell
Get-Content "C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log" -Tail 50
```

### Search for Specific Errors:
```powershell
Get-Content "C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log" | Select-String -Pattern "ERROR|Exception" -Context 2,5
```

### View Errors from Today:
```powershell
Get-Content "C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log" | Select-String -Pattern "2025-12-09"
```

---

## ✅ Summary

**Critical Issues:**
1. ❌ **Missing `personal_access_tokens` table** - Run `php artisan migrate`
2. ⚠️ **File permission issues** - Clear cache or fix permissions
3. ⚠️ **View class error** - Will be fixed automatically after migration

**Action Required:**
1. **Run migrations** - This is the most important fix
2. **Clear cache** - Ensures all changes are applied
3. **Test API endpoints** - Verify everything works

**After fixes:**
- ✅ All API endpoints should work
- ✅ Authentication will work
- ✅ No more 500 errors (except for actual code errors)

---

**Run the migrations first - this will fix most of your 500 errors!** 🚀


