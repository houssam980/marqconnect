<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;

Log::info('===== CHANNELS.PHP IS BEING LOADED =====');

try {
    // Presence channels for chat - Echo adds 'presence-' prefix
    Broadcast::channel('chat.general', function (User $user) {
        Log::info('Channel auth: chat.general', ['user_id' => $user->id]);
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];
    });

    Broadcast::channel('chat.project-{projectId}', function (User $user, $projectId) {
        Log::info('Channel auth: chat.project-' . $projectId, ['user_id' => $user->id]);
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];
    });

    // Private channel for user notifications - Echo adds 'private-' prefix
    Broadcast::channel('user.{userId}', function (User $user, $userId) {
        Log::info('Channel auth: user.' . $userId, ['user_id' => $user->id, 'authenticated_as' => $user->id]);
        $allowed = (int) $user->id === (int) $userId;
        Log::info('Channel auth result', ['allowed' => $allowed, 'user_id' => $user->id, 'requested_userId' => $userId]);
        return $allowed;
    });

    Log::info('===== CHANNELS.PHP LOADED - 3 channels registered =====');
} catch (\Exception $e) {
    Log::error('===== CHANNELS.PHP LOADING FAILED =====', [
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}