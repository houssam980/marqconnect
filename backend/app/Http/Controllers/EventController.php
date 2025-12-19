<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Notification;
use App\Models\User;
use App\Events\EventCreated as EventCreatedBroadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    /**
     * Get all events
     */
    public function index(Request $request)
    {
        $events = Event::with('creator:id,name')
            ->orderBy('start_date', 'asc')
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'start_date' => $event->start_date->toISOString(),
                    'end_date' => $event->end_date->toISOString(),
                    'location' => $event->location,
                    'color' => $event->color,
                    'created_by' => $event->creator->name ?? 'Unknown',
                    'created_at' => $event->created_at->toISOString(),
                ];
            });

        return response()->json($events);
    }

    /**
     * Create a new event (Admin only)
     */
    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Parse dates - handle both ISO format and datetime-local format
        $startDate = \Carbon\Carbon::parse($request->start_date)->format('Y-m-d H:i:s');
        $endDate = \Carbon\Carbon::parse($request->end_date)->format('Y-m-d H:i:s');

        $event = Event::create([
            'created_by' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'location' => $request->location,
            'color' => $request->color ?? 'bg-blue-500',
        ]);

        $event->load('creator:id,name');

        // Create notifications for all users (except admin who created it)
        $users = User::where('id', '!=', $request->user()->id)->get();
        foreach ($users as $user) {
            $notification = Notification::create([
                'user_id' => $user->id,
                'type' => 'event',
                'title' => 'New Event Created',
                'message' => "A new event '{$event->title}' has been scheduled",
                'link' => '/events',
                'data' => [
                    'event_id' => $event->id,
                    'event_title' => $event->title,
                ],
                'read' => false,
            ]);

            // Broadcast notification via WebSocket
            try {
                if (config('broadcasting.default') !== 'null' && config('broadcasting.default') !== 'log') {
                    broadcast(new EventCreatedBroadcast([
                        'id' => $notification->id,
                        'type' => $notification->type,
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'link' => $notification->link,
                        'data' => $notification->data,
                        'read' => $notification->read,
                        'created_at' => $notification->created_at->toISOString(),
                        'user_id' => $user->id,
                    ]))->toOthers();
                }
            } catch (\Exception $e) {
                \Log::info('Broadcasting failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Event created successfully',
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'start_date' => $event->start_date->toISOString(),
                'end_date' => $event->end_date->toISOString(),
                'location' => $event->location,
                'color' => $event->color,
                'created_by' => $event->creator->name ?? 'Unknown',
                'created_at' => $event->created_at->toISOString(),
            ],
        ], 201);
    }

    /**
     * Update an event (Admin only)
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event = Event::find($id);
        if (!$event) {
            return response()->json(['message' => 'Event not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'location' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only([
            'title',
            'description',
            'location',
            'color',
        ]);

        // Parse dates if provided
        if ($request->has('start_date')) {
            $updateData['start_date'] = \Carbon\Carbon::parse($request->start_date)->format('Y-m-d H:i:s');
        }
        if ($request->has('end_date')) {
            $updateData['end_date'] = \Carbon\Carbon::parse($request->end_date)->format('Y-m-d H:i:s');
        }

        $event->update($updateData);

        $event->load('creator:id,name');

        return response()->json([
            'message' => 'Event updated successfully',
            'event' => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'start_date' => $event->start_date->toISOString(),
                'end_date' => $event->end_date->toISOString(),
                'location' => $event->location,
                'color' => $event->color,
                'created_by' => $event->creator->name ?? 'Unknown',
                'created_at' => $event->created_at->toISOString(),
            ],
        ]);
    }

    /**
     * Delete an event (Admin only)
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event = Event::find($id);
        if (!$event) {
            return response()->json(['message' => 'Event not found'], 404);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }
}
