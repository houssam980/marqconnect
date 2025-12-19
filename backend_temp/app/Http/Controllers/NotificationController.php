<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get all notifications for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                \Log::warning('NotificationController@index: No authenticated user');
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $notifications = Notification::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            return response()->json($notifications);
        } catch (\Exception $e) {
            \Log::error('NotificationController@index error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get unread notifications count
     */
    public function unreadCount(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                \Log::warning('NotificationController@unreadCount: No authenticated user');
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $count = Notification::where('user_id', $user->id)
                ->where('read', false)
                ->count();

            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            \Log::error('NotificationController@unreadCount error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $notification = Notification::where('user_id', $request->user()->id)
                ->where('id', $id)
                ->first();

            if (!$notification) {
                return response()->json(['message' => 'Notification not found'], 404);
            }

            $notification->update(['read' => true]);

            return response()->json(['message' => 'Notification marked as read']);
        } catch (\Exception $e) {
            \Log::error('NotificationController@markAsRead error: ' . $e->getMessage());
            return response()->json(['message' => 'Server Error'], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        try {
            Notification::where('user_id', $request->user()->id)
                ->where('read', false)
                ->update(['read' => true]);

            return response()->json(['message' => 'All notifications marked as read']);
        } catch (\Exception $e) {
            \Log::error('NotificationController@markAllAsRead error: ' . $e->getMessage());
            return response()->json(['message' => 'Server Error'], 500);
        }
    }

    /**
     * Delete a notification
     */
    public function destroy(Request $request, $id)
    {
        try {
            $notification = Notification::where('user_id', $request->user()->id)
                ->where('id', $id)
                ->first();

            if (!$notification) {
                return response()->json(['message' => 'Notification not found'], 404);
            }

            $notification->delete();

            return response()->json(['message' => 'Notification deleted']);
        } catch (\Exception $e) {
            \Log::error('NotificationController@destroy error: ' . $e->getMessage());
            return response()->json(['message' => 'Server Error'], 500);
        }
    }
}