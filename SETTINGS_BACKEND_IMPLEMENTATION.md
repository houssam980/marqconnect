# 🔧 Settings Page Backend Implementation Guide

## 📋 Required Laravel Backend Endpoints

You need to add these 3 endpoints to your Laravel backend to make the Settings page work:

---

## ✅ Step 1: Add Routes to `routes/api.php`

**File:** `C:\wamp64\www\marqconnect_backend\routes\api.php`

Add these routes inside the `auth:sanctum` middleware group:

```php
Route::middleware('auth:sanctum')->group(function () {
    // ... existing routes ...
    
    // User profile & settings routes
    Route::put('/user/update-profile', [UserController::class, 'updateProfile']);
    Route::put('/user/change-password', [UserController::class, 'changePassword']);
    Route::put('/user/notification-preferences', [UserController::class, 'updateNotificationPreferences']);
});
```

---

## ✅ Step 2: Add Controller Methods to `UserController`

**File:** `C:\wamp64\www\marqconnect_backend\app\Http\Controllers\UserController.php`

**If file doesn't exist, create it:**
```bash
cd C:\wamp64\www\marqconnect_backend
php artisan make:controller UserController
```

**Add these methods to the controller:**

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Update user profile (name only, email cannot be changed)
     */
    public function updateProfile(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
            ]);

            $user = $request->user();
            $oldName = $user->name;
            
            $user->name = $request->name;
            $user->save();

            Log::info('Profile updated', [
                'user_id' => $user->id,
                'old_name' => $oldName,
                'new_name' => $user->name,
            ]);

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ]);
        } catch (ValidationException $e) {
            Log::error('Profile update validation failed', [
                'user_id' => $request->user()->id ?? null,
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Profile update failed', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to update profile',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        try {
            $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            $user = $request->user();

            // Verify current password
            if (!Hash::check($request->current_password, $user->password)) {
                Log::warning('Password change failed - incorrect current password', [
                    'user_id' => $user->id,
                ]);
                return response()->json([
                    'message' => 'Current password is incorrect',
                ], 401);
            }

            // Update password
            $user->password = Hash::make($request->new_password);
            $user->save();

            Log::info('Password changed successfully', [
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Password changed successfully',
            ]);
        } catch (ValidationException $e) {
            Log::error('Password change validation failed', [
                'user_id' => $request->user()->id ?? null,
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Password change failed', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to change password',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update notification preferences
     */
    public function updateNotificationPreferences(Request $request)
    {
        try {
            $request->validate([
                'notifications_enabled' => 'required|boolean',
            ]);

            $user = $request->user();
            
            // Store preference in user meta or separate table
            // For now, we'll just log it and return success
            // You can add a notifications_enabled column to users table if needed
            
            Log::info('Notification preferences updated', [
                'user_id' => $user->id,
                'notifications_enabled' => $request->notifications_enabled,
            ]);

            return response()->json([
                'message' => 'Notification preferences updated successfully',
                'notifications_enabled' => $request->notifications_enabled,
            ]);
        } catch (ValidationException $e) {
            Log::error('Notification preferences validation failed', [
                'user_id' => $request->user()->id ?? null,
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Notification preferences update failed', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to update notification preferences',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
```

---

## ✅ Step 3: Make Sure UserController is Imported in routes/api.php

Add this at the top of `routes/api.php`:

```php
use App\Http\Controllers\UserController;
```

---

## ✅ Step 4: (Optional) Add notifications_enabled Column to Users Table

If you want to store notification preferences in the database:

**Create migration:**
```bash
php artisan make:migration add_notifications_enabled_to_users_table
```

**Edit the migration file:**
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('notifications_enabled')->default(true)->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notifications_enabled');
        });
    }
};
```

**Run migration:**
```bash
php artisan migrate
```

**Update updateNotificationPreferences method to save to database:**
```php
public function updateNotificationPreferences(Request $request)
{
    try {
        $request->validate([
            'notifications_enabled' => 'required|boolean',
        ]);

        $user = $request->user();
        $user->notifications_enabled = $request->notifications_enabled;
        $user->save();
        
        Log::info('Notification preferences updated', [
            'user_id' => $user->id,
            'notifications_enabled' => $request->notifications_enabled,
        ]);

        return response()->json([
            'message' => 'Notification preferences updated successfully',
            'notifications_enabled' => $user->notifications_enabled,
        ]);
    } catch (\Exception $e) {
        Log::error('Notification preferences update failed', [
            'user_id' => $request->user()->id ?? null,
            'error' => $e->getMessage(),
        ]);
        return response()->json([
            'message' => 'Failed to update notification preferences',
            'error' => $e->getMessage(),
        ], 500);
    }
}
```

---

## ✅ Step 5: Clear Laravel Cache

```bash
cd C:\wamp64\www\marqconnect_backend
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan route:list | findstr user
```

---

## 🧪 Step 6: Test the Endpoints

### Test 1: Update Profile (Name)

```bash
# Test via curl or Postman
curl -X PUT http://localhost/marqconnect_backend/public/api/user/update-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Name"}'
```

**Expected Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "name": "New Name",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### Test 2: Change Password

```bash
curl -X PUT http://localhost/marqconnect_backend/public/api/user/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "oldpassword",
    "new_password": "newpassword123",
    "new_password_confirmation": "newpassword123"
  }'
```

**Expected Response:**
```json
{
  "message": "Password changed successfully"
}
```

### Test 3: Update Notification Preferences

```bash
curl -X PUT http://localhost/marqconnect_backend/public/api/user/notification-preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notifications_enabled": false}'
```

**Expected Response:**
```json
{
  "message": "Notification preferences updated successfully",
  "notifications_enabled": false
}
```

---

## 📊 Check Laravel Logs for Debugging

All operations are logged for debugging purposes:

**Log File:** `C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log`

**Check logs:**
```bash
# View last 50 lines
Get-Content C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log -Tail 50

# Watch logs in real-time
Get-Content C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log -Wait
```

---

## 🔍 Common Issues & Solutions

### Issue 1: Route not found (404)

**Solution:**
- Check route exists: `php artisan route:list | findstr user`
- Clear route cache: `php artisan route:clear`
- Make sure UserController is imported in routes/api.php

### Issue 2: Unauthorized (401)

**Solution:**
- Check token is valid
- Check auth:sanctum middleware is applied
- Verify user is authenticated

### Issue 3: Validation error (422)

**Solution:**
- Check request payload matches validation rules
- Current password must match for password change
- New password must be at least 8 characters
- Password confirmation must match new password

### Issue 4: Internal server error (500)

**Solution:**
- Check Laravel logs: `storage/logs/laravel.log`
- Verify UserController exists
- Check database connection
- Make sure Hash facade is imported

---

## ✅ Frontend Integration

The frontend is already configured and will automatically:

1. **Update Profile**: Send PUT request to `/api/user/update-profile` with new name
2. **Change Password**: Send PUT request to `/api/user/change-password` with passwords
3. **Toggle Notifications**: Send PUT request to `/api/user/notification-preferences`

All responses are handled with toast notifications and proper error messages.

---

## 🎯 Summary

After implementing these backend endpoints:

- ✅ Users can change their username (displayed to everyone)
- ✅ Users can change their password securely
- ✅ Users can toggle notification preferences
- ✅ Email cannot be modified (as required)
- ✅ All changes are logged for debugging
- ✅ All operations have proper error handling
- ✅ Frontend automatically refreshes user data after updates

---

## 🚀 Next Steps

1. **Copy the routes** to `routes/api.php`
2. **Create/update UserController** with the methods
3. **Clear Laravel cache**
4. **Test the endpoints** using the examples above
5. **Check Laravel logs** if any errors occur

**The frontend is ready - just implement the backend!** 🎉
