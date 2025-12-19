<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Get all users (Admin only)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            // Check if user is authenticated
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Check if user is admin
            if (!$user->role || $user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $users = User::select('id', 'name', 'email', 'role', 'created_at', 'last_activity')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    // Check if online (last activity within 2 minutes)
                    $isOnline = $user->last_activity && (time() - $user->last_activity) < 120;
                    
                    // Format last seen time
                    $lastSeenText = 'Never';
                    if ($user->last_activity) {
                        if ($isOnline) {
                            $lastSeenText = 'Online';
                        } else {
                            $diff = time() - $user->last_activity;
                            if ($diff < 60) {
                                $lastSeenText = 'Just now';
                            } elseif ($diff < 3600) {
                                $minutes = floor($diff / 60);
                                $lastSeenText = $minutes . ' minute' . ($minutes > 1 ? 's' : '') . ' ago';
                            } elseif ($diff < 86400) {
                                $hours = floor($diff / 3600);
                                $lastSeenText = $hours . ' hour' . ($hours > 1 ? 's' : '') . ' ago';
                            } else {
                                $days = floor($diff / 86400);
                                $lastSeenText = $days . ' day' . ($days > 1 ? 's' : '') . ' ago';
                            }
                        }
                    }
                    
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role ?? 'user',
                        'created_at' => $user->created_at,
                        'is_online' => $isOnline,
                        'last_seen_at' => $user->last_activity ? date('Y-m-d H:i:s', $user->last_activity) : null,
                        'last_seen_text' => $lastSeenText,
                    ];
                });

            return response()->json($users);
        } catch (\Exception $e) {
            Log::error('UserController@index error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new user (Admin only)
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            // Check if user is authenticated
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Check if user is admin
            if (!$user->role || $user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:6',
                'role' => 'required|in:admin,user',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $newUser = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
            ]);

            Log::info('Admin created new user', [
                'admin_id' => $user->id,
                'new_user_id' => $newUser->id,
                'new_user_email' => $newUser->email,
            ]);

            return response()->json([
                'message' => 'User created successfully',
                'user' => [
                    'id' => $newUser->id,
                    'name' => $newUser->name,
                    'email' => $newUser->email,
                    'role' => $newUser->role,
                    'created_at' => $newUser->created_at->toISOString(),
                    'is_online' => false,
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('UserController@store error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Server Error', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing user (Admin only)
     */
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();

            // Check if user is authenticated
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Check if user is admin
            if (!$user->role || $user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $targetUser = User::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
                'password' => 'sometimes|nullable|string|min:6',
                'role' => 'sometimes|required|in:admin,user',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($request->has('name')) {
                $targetUser->name = $request->name;
            }

            if ($request->has('email')) {
                $targetUser->email = $request->email;
            }

            if ($request->has('password') && $request->password) {
                $targetUser->password = Hash::make($request->password);
            }

            if ($request->has('role')) {
                $targetUser->role = $request->role;
            }

            $targetUser->save();

            Log::info('Admin updated user', [
                'admin_id' => $user->id,
                'target_user_id' => $targetUser->id,
            ]);

            return response()->json([
                'message' => 'User updated successfully',
                'user' => [
                    'id' => $targetUser->id,
                    'name' => $targetUser->name,
                    'email' => $targetUser->email,
                    'role' => $targetUser->role,
                    'created_at' => $targetUser->created_at->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('UserController@update error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Server Error', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a user (Admin only)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();

            // Check if user is authenticated
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Check if user is admin
            if (!$user->role || $user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Prevent deleting yourself
            if ($user->id == $id) {
                return response()->json(['message' => 'Cannot delete yourself'], 400);
            }

            $targetUser = User::findOrFail($id);
            $targetUser->delete();

            Log::info('Admin deleted user', [
                'admin_id' => $user->id,
                'deleted_user_id' => $id,
            ]);

            return response()->json([
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('UserController@destroy error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Server Error', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update user profile (name only)
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();
            
            $request->validate([
                'name' => 'required|string|max:255|min:2',
            ]);

            $oldName = $user->name;
            $user->name = $request->name;
            $user->save();

            Log::info('User updated profile', [
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
                    'role' => $user->role ?? 'user',
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('UserController@updateProfile error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update profile'], 500);
        }
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        try {
            $user = $request->user();
            
            $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8|confirmed',
            ]);

            // Verify current password
            if (!Hash::check($request->current_password, $user->password)) {
                Log::warning('Failed password change attempt', [
                    'user_id' => $user->id,
                    'reason' => 'incorrect_current_password',
                ]);
                
                return response()->json([
                    'message' => 'Current password is incorrect',
                ], 422);
            }

            // Update password
            $user->password = Hash::make($request->new_password);
            $user->save();

            Log::info('User changed password', ['user_id' => $user->id]);

            return response()->json([
                'message' => 'Password changed successfully',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('UserController@changePassword error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to change password'], 500);
        }
    }

    /**
     * Update notification preferences
     */
    public function updateNotificationPreferences(Request $request)
    {
        try {
            $user = $request->user();
            
            $request->validate([
                'notifications_enabled' => 'required|boolean',
            ]);

            Log::info('User updated notification preferences', [
                'user_id' => $user->id,
                'notifications_enabled' => $request->notifications_enabled,
            ]);

            return response()->json([
                'message' => 'Notification preferences updated',
                'notifications_enabled' => $request->notifications_enabled,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('UserController@updateNotificationPreferences error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update preferences'], 500);
        }
    }
}