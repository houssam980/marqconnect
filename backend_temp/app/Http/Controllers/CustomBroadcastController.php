<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast as BroadcastFacade;
use Illuminate\Support\Facades\Log;

class CustomBroadcastController extends Controller
{
    public function authenticate(Request $request)
    {
        try {
            // Log the incoming request details
            Log::info('Broadcasting auth request', [
                'channel_name' => $request->input('channel_name'),
                'socket_id' => $request->input('socket_id'),
                'user_id' => $request->user()?->id,
                'all_input' => $request->all()
            ]);

            // Check if user is authenticated
            if (!$request->user()) {
                Log::error('Broadcasting auth FAILED - No authenticated user');
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $response = BroadcastFacade::auth($request);

            Log::info('Broadcasting auth SUCCESS', [
                'channel_name' => $request->input('channel_name'),
                'response_type' => gettype($response),
                'response' => is_object($response) ? get_class($response) : $response
            ]);

            return $response;
        } catch (\Throwable $e) {
            Log::error('Broadcasting auth FAILED', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'channel_name' => $request->input('channel_name'),
                'user_id' => $request->user()?->id,
                'exception_class' => get_class($e)
            ]);

            return response()->json([
                'message' => 'Broadcasting authentication failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}