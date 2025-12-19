<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskStatusController;
use App\Http\Controllers\MessageController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Broadcasting routes for Pusher authentication
// Custom broadcasting routes with logging
Route::middleware(['auth:sanctum'])->group(function () {
    Route::match(['get', 'post'], '/broadcasting/auth', [App\Http\Controllers\CustomBroadcastController::class, 'authenticate']);
});

Route::middleware(['auth:sanctum', 'update.last.seen'])->group(function () {
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_online' => $user->is_online,
            'last_seen_at' => $user->last_seen_at,
            'last_seen_text' => $user->last_seen_text,
        ];
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    // User Profile & Settings routes (self-service)
    Route::put('/user/update-profile', [App\Http\Controllers\UserController::class, 'updateProfile']);
    Route::put('/user/change-password', [App\Http\Controllers\UserController::class, 'changePassword']);
    Route::put('/user/notification-preferences', [App\Http\Controllers\UserController::class, 'updateNotificationPreferences']);

    // User Management (Admin only)
    Route::get('/users', [App\Http\Controllers\UserController::class, 'index']);
    Route::post('/users', [App\Http\Controllers\UserController::class, 'store']);
    Route::put('/users/{id}', [App\Http\Controllers\UserController::class, 'update']);
    Route::delete('/users/{id}', [App\Http\Controllers\UserController::class, 'destroy']);

    // Task Status routes
    Route::get('/task-statuses', [TaskStatusController::class, 'index']);
    Route::post('/task-statuses', [TaskStatusController::class, 'store']);
    Route::put('/task-statuses/{id}', [TaskStatusController::class, 'update']);
    Route::delete('/task-statuses/{id}', [TaskStatusController::class, 'destroy']);

    // Task routes
    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::put('/tasks/{id}', [TaskController::class, 'update']);
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy']);
    Route::post('/tasks/{id}/assign', [TaskController::class, 'assignUsers']);

    // Message routes
    Route::get('/messages/{space}', [MessageController::class, 'index']);
    Route::get('/messages/{space}/new', [MessageController::class, 'getNew']);
    Route::post('/messages/{space}', [MessageController::class, 'store']);
    Route::delete('/messages/{space}/{id}', [MessageController::class, 'destroy']);

    // Project routes
    Route::get('/projects', [App\Http\Controllers\ProjectController::class, 'index']);
    Route::get('/projects/{id}', [App\Http\Controllers\ProjectController::class, 'show']);
    Route::post('/projects', [App\Http\Controllers\ProjectController::class, 'store']);
    Route::put('/projects/{id}', [App\Http\Controllers\ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [App\Http\Controllers\ProjectController::class, 'destroy']);
    Route::post('/projects/{id}/invite', [App\Http\Controllers\ProjectController::class, 'inviteUsers']);
    Route::delete('/projects/{id}/members/{userId}', [App\Http\Controllers\ProjectController::class, 'removeUser']);

    // Document routes
    Route::get('/projects/{project_id}/documents', [App\Http\Controllers\DocumentController::class, 'index']);
    Route::post('/projects/{project_id}/documents', [App\Http\Controllers\DocumentController::class, 'store']);
    Route::delete('/documents/{id}', [App\Http\Controllers\DocumentController::class, 'destroy']);

    // Event routes
    Route::get('/events', [App\Http\Controllers\EventController::class, 'index']);
    Route::post('/events', [App\Http\Controllers\EventController::class, 'store']);
    Route::put('/events/{id}', [App\Http\Controllers\EventController::class, 'update']);
    Route::delete('/events/{id}', [App\Http\Controllers\EventController::class, 'destroy']);

    // Notification routes
    Route::get('/notifications', [App\Http\Controllers\NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [App\Http\Controllers\NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [App\Http\Controllers\NotificationController::class, 'destroy']);
});
