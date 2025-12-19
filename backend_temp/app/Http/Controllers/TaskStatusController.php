<?php

namespace App\Http\Controllers;

use App\Models\TaskStatus;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaskStatusController extends Controller
{
    /**
     * Get all task statuses for the authenticated user
     * Creates default statuses if none exist
     * Admins and users share the same statuses from the first admin user
     */
    public function index(Request $request)
    {
        // Check if any statuses exist in the system
        $existingStatuses = TaskStatus::orderBy('order')->get();

        if ($existingStatuses->isEmpty()) {
            // Create default statuses for the first time
            $defaultStatuses = [
                ['name' => 'To Do', 'color' => 'bg-zinc-500', 'order' => 1],
                ['name' => 'In Progress', 'color' => 'bg-blue-500', 'order' => 2],
                ['name' => 'Done', 'color' => 'bg-green-500', 'order' => 3],
            ];

            foreach ($defaultStatuses as $status) {
                TaskStatus::create([
                    'user_id' => $request->user()->id,
                    'name' => $status['name'],
                    'color' => $status['color'],
                    'order' => $status['order'],
                ]);
            }

            $existingStatuses = TaskStatus::orderBy('order')->get();
        }

        return response()->json($existingStatuses);
    }

    /**
     * Create a new task status
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'color' => 'nullable|string|max:100',
            'order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Get the max order value
        $maxOrder = TaskStatus::where('user_id', $request->user()->id)->max('order') ?? 0;

        $status = TaskStatus::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'color' => $request->color ?? 'bg-zinc-500',
            'order' => $request->order ?? ($maxOrder + 1),
        ]);

        return response()->json([
            'message' => 'Status created successfully',
            'status' => $status,
        ], 201);
    }

    /**
     * Update a task status
     */
    public function update(Request $request, $id)
    {
        $status = TaskStatus::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$status) {
            return response()->json(['message' => 'Status not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:100',
            'order' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $status->update($request->only(['name', 'color', 'order']));

        return response()->json([
            'message' => 'Status updated successfully',
            'status' => $status,
        ]);
    }

    /**
     * Delete a task status
     */
    public function destroy(Request $request, $id)
    {
        $status = TaskStatus::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$status) {
            return response()->json(['message' => 'Status not found'], 404);
        }

        // Check if there are tasks using this status
        $tasksCount = $request->user()->tasks()->where('status', $status->name)->count();
        
        if ($tasksCount > 0) {
            return response()->json([
                'message' => 'Cannot delete status with existing tasks',
                'tasks_count' => $tasksCount
            ], 400);
        }

        $status->delete();

        return response()->json([
            'message' => 'Status deleted successfully',
        ]);
    }
}
