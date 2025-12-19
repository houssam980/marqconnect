<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Notification;
use App\Models\User;
use App\Events\TaskAssigned as TaskAssignedBroadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TaskController extends Controller
{
    /**
     * Get all tasks for the authenticated user
     * - Admins see all tasks
     * - Regular users see only tasks assigned to them
     * - Can filter by project_id
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $projectId = $request->query('project_id');
        
        if ($user->role === 'admin') {
            // Admins see all tasks with assigned users
            $query = Task::with(['user', 'assignedUsers', 'project']);
            
            if ($projectId) {
                $query->where('project_id', $projectId);
            }
            
            $tasks = $query->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'project_id' => $task->project_id,
                        'title' => $task->title,
                        'tag' => $task->tag,
                        'status' => $task->status,
                        'priority' => $task->priority,
                        'date' => $task->date,
                        'assignees' => $task->assignees,
                        'assigned_users' => $task->assignedUsers->map(function ($u) {
                            return [
                                'id' => $u->id,
                                'name' => $u->name,
                                'email' => $u->email,
                            ];
                        }),
                        'created_by' => [
                            'id' => $task->user->id,
                            'name' => $task->user->name,
                        ],
                    ];
                });
        } else {
            // Regular users see only tasks assigned to them
            $query = $user->assignedTasks()
                ->with(['user', 'assignedUsers', 'project']);
            
            if ($projectId) {
                $query->where('project_id', $projectId);
            }
            
            $tasks = $query->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'project_id' => $task->project_id,
                        'title' => $task->title,
                        'tag' => $task->tag,
                        'status' => $task->status,
                        'priority' => $task->priority,
                        'date' => $task->date,
                        'assignees' => $task->assignees,
                        'assigned_users' => $task->assignedUsers->map(function ($u) {
                            return [
                                'id' => $u->id,
                                'name' => $u->name,
                                'email' => $u->email,
                            ];
                        }),
                        'created_by' => [
                            'id' => $task->user->id,
                            'name' => $task->user->name,
                        ],
                    ];
                });
        }

        return response()->json($tasks);
    }

    /**
     * Create a new task
     * - Admins can assign tasks to users
     * - Regular users can only create tasks for themselves
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'tag' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:255',
            'priority' => 'nullable|in:Low,Medium,High',
            'date' => 'nullable|string',
            'project_id' => 'nullable|integer|exists:projects,id',
            'assignees' => 'nullable|array',
            'assignees.*' => 'integer|exists:users,id',
            'assigned_user_ids' => 'nullable|array',
            'assigned_user_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $task = Task::create([
            'user_id' => $request->user()->id,
            'project_id' => $request->project_id,
            'title' => $request->title,
            'tag' => $request->tag,
            'status' => $request->status ?? 'To Do',
            'priority' => $request->priority ?? 'Medium',
            'date' => $request->date,
            'assignees' => $request->assignees ?? [],
        ]);

        // If admin assigns users to the task
        if ($request->user()->role === 'admin' && $request->has('assignees') && is_array($request->assignees) && count($request->assignees) > 0) {
            foreach ($request->assignees as $userId) {
                $task->assignedUsers()->syncWithoutDetaching([$userId => ['assigned_by' => $request->user()->id]]);
                
                // Create notification for assigned user
                $assignedUser = User::find($userId);
                if ($assignedUser) {
                    $notification = Notification::create([
                        'user_id' => $userId,
                        'type' => 'task_assigned',
                        'title' => 'New Task Assigned',
                        'message' => "You have been assigned to task: '{$task->title}'",
                        'link' => '/home',
                        'data' => [
                            'task_id' => $task->id,
                            'task_title' => $task->title,
                            'assigned_by' => $request->user()->name,
                        ],
                        'read' => false,
                    ]);

                    // Broadcast notification via WebSocket
                    try {
                        if (config('broadcasting.default') !== 'null' && config('broadcasting.default') !== 'log') {
                            broadcast(new TaskAssignedBroadcast([
                                'id' => $notification->id,
                                'type' => $notification->type,
                                'title' => $notification->title,
                                'message' => $notification->message,
                                'link' => $notification->link,
                                'data' => $notification->data,
                                'read' => $notification->read,
                                'created_at' => $notification->created_at->toISOString(),
                                'user_id' => $userId,
                            ]))->toOthers();
                        }
                    } catch (\Exception $e) {
                        \Log::info('Broadcasting failed: ' . $e->getMessage());
                    }
                }
            }
        }

        // Load relationships for response
        $task->load(['user', 'assignedUsers']);

        return response()->json([
            'message' => 'Task created successfully',
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'tag' => $task->tag,
                'status' => $task->status,
                'priority' => $task->priority,
                'date' => $task->date,
                'assignees' => $task->assignees,
                'assigned_users' => $task->assignedUsers->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                    ];
                }),
            ],
        ], 201);
    }

    /**
     * Update a task
     * - Admins can update any task
     * - Regular users can update tasks assigned to them (via task_assignments)
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        
        if ($user->role === 'admin') {
            // Admins can update any task
            $task = Task::find($id);
        } else {
            // Regular users can update tasks assigned to them
            $task = Task::whereHas('assignedUsers', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })->where('id', $id)->first();
        }

        if (!$task) {
            return response()->json(['message' => 'Task not found or unauthorized'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'nullable|string|max:255',
            'tag' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:255',
            'priority' => 'nullable|in:Low,Medium,High',
            'date' => 'nullable|string',
            'assignees' => 'nullable|array',
            'assignees.*' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $task->update($request->only([
            'title',
            'tag',
            'status',
            'priority',
            'date',
            'assignees',
        ]));

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task,
        ]);
    }

    /**
     * Delete a task
     * - Admins can delete any task
     * - Regular users can only delete their own tasks
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        
        if ($user->role === 'admin') {
            // Admins can delete any task
            $task = Task::find($id);
        } else {
            // Regular users can only delete their own tasks
            $task = Task::where('user_id', $user->id)
                ->where('id', $id)
                ->first();
        }

        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Assign users to a task (Admin only)
     */
    public function assignUsers(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $task = Task::find($id);
        if (!$task) {
            return response()->json(['message' => 'Task not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Sync assignments (replaces existing)
        $task->assignedUsers()->sync(
            collect($request->user_ids)->mapWithKeys(function ($userId) use ($request) {
                return [$userId => ['assigned_by' => $request->user()->id]];
            })
        );

        $task->load('assignedUsers');

        // Create notifications for assigned users
        foreach ($request->user_ids as $userId) {
            $assignedUser = User::find($userId);
            if ($assignedUser) {
                $notification = Notification::create([
                    'user_id' => $userId,
                    'type' => 'task_assigned',
                    'title' => 'Task Assigned to You',
                    'message' => "You have been assigned to task: '{$task->title}'",
                    'link' => '/home',
                    'data' => [
                        'task_id' => $task->id,
                        'task_title' => $task->title,
                        'assigned_by' => $request->user()->name,
                    ],
                    'read' => false,
                ]);

                // Broadcast notification via WebSocket
                try {
                    if (config('broadcasting.default') !== 'null' && config('broadcasting.default') !== 'log') {
                        broadcast(new TaskAssignedBroadcast([
                            'id' => $notification->id,
                            'type' => $notification->type,
                            'title' => $notification->title,
                            'message' => $notification->message,
                            'link' => $notification->link,
                            'data' => $notification->data,
                            'read' => $notification->read,
                            'created_at' => $notification->created_at->toISOString(),
                            'user_id' => $userId,
                        ]))->toOthers();
                    }
                } catch (\Exception $e) {
                    \Log::info('Broadcasting failed: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => 'Users assigned successfully',
            'assigned_users' => $task->assignedUsers->map(function ($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                ];
            }),
        ]);
    }
}
