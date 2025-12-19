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
Route::middleware(['auth:sanctum'])->post('/broadcasting/auth', function () {
    return Broadcast::auth(request());
});

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return [
            'id' => $request->user()->id,
            'name' => $request->user()->name,
            'email' => $request->user()->email,
            'role' => $request->user()->role,
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
    Route::get('/documents/{id}/download', [App\Http\Controllers\DocumentController::class, 'download']);
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

    // Custom Cards
    Route::get('/projects/{project}/boarding/cards', [App\Http\Controllers\BoardingController::class, 'getCards']);
    Route::post('/projects/{project}/boarding/cards', [App\Http\Controllers\BoardingController::class, 'createCard']);
    Route::delete('/projects/{project}/boarding/cards/{card}', [App\Http\Controllers\BoardingController::class, 'deleteCard']);
    Route::get('/projects/{project}/boarding/cards/{card}/items', [App\Http\Controllers\BoardingController::class, 'getCardItems']);
    Route::post('/projects/{project}/boarding/cards/{card}/items', [App\Http\Controllers\BoardingController::class, 'createCardItem']);
    Route::delete('/projects/{project}/boarding/cards/{card}/items/{item}', [App\Http\Controllers\BoardingController::class, 'deleteCardItem']);

    // Boarding System Routes
    Route::get('/projects/{project}/boarding/tasks', [App\Http\Controllers\BoardingController::class, 'getTasks']);
    Route::post('/projects/{project}/boarding/tasks', [App\Http\Controllers\BoardingController::class, 'createTask']);
    Route::put('/projects/{project}/boarding/tasks/{task}', [App\Http\Controllers\BoardingController::class, 'updateTask']);
    Route::delete('/projects/{project}/boarding/tasks/{task}', [App\Http\Controllers\BoardingController::class, 'deleteTask']);
    Route::get('/projects/{project}/boarding/documents', [App\Http\Controllers\BoardingController::class, 'getDocuments']);
    Route::post('/projects/{project}/boarding/documents', [App\Http\Controllers\BoardingController::class, 'uploadDocument']);
    Route::delete('/projects/{project}/boarding/documents/{document}', [App\Http\Controllers\BoardingController::class, 'deleteDocument']);
    Route::get('/projects/{project}/boarding/documents/{document}/download', [App\Http\Controllers\BoardingController::class, 'downloadDocument']);
    Route::get('/projects/{project}/boarding/links', [App\Http\Controllers\BoardingController::class, 'getLinks']);
    Route::post('/projects/{project}/boarding/links', [App\Http\Controllers\BoardingController::class, 'createLink']);
    Route::delete('/projects/{project}/boarding/links/{link}', [App\Http\Controllers\BoardingController::class, 'deleteLink']);
    Route::get('/projects/{project}/boarding/notes', [App\Http\Controllers\BoardingController::class, 'getNotes']);
    Route::post('/projects/{project}/boarding/notes', [App\Http\Controllers\BoardingController::class, 'createNote']);
    Route::delete('/projects/{project}/boarding/notes/{note}', [App\Http\Controllers\BoardingController::class, 'deleteNote']);
    // Activity Tracking Routes
    Route::post('/activity/start', [App\Http\Controllers\ActivityController::class, 'startSession']);
    Route::post('/activity/heartbeat', [App\Http\Controllers\ActivityController::class, 'heartbeat']);
    Route::post('/activity/end', [App\Http\Controllers\ActivityController::class, 'endSession']);
    Route::get('/users/activity', [App\Http\Controllers\ActivityController::class, 'getUsersActivity']);
    Route::get('/users/{userId}/activity', [App\Http\Controllers\ActivityController::class, 'getUserActivity']);
    Route::post('/activity/cleanup', [App\Http\Controllers\ActivityController::class, 'cleanupStaleSessions']);
    // Clear messages endpoints
    Route::delete('/messages/general/clear', [App\Http\Controllers\MessageController::class, 'clearGeneral']);
    Route::delete('/messages/project-{projectId}/clear', [App\Http\Controllers\MessageController::class, 'clearProject']);
});
