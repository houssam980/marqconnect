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

            $users = User::select('id', 'name', 'email', 'role', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role ?? 'user',
                        'created_at' => $user->created_at->toISOString(),
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