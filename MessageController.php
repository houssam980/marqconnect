<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Document;
use App\Models\Project;
use App\Models\Notification;
use App\Models\User;
use App\Events\MessageSent;
use App\Events\EventCreated as NotificationBroadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * Get messages for a specific space
     */
    public function index(Request $request, $space = 'general')
    {
        try {
            $user = $request->user();
            
            // If space is a project (format: project-{id})
            if (str_starts_with($space, 'project-')) {
                $projectId = str_replace('project-', '', $space);
                
                // Check if user has access to this project
                if ($user->role !== 'admin') {
                    $hasAccess = $user->projects()->where('projects.id', $projectId)->exists();
                    if (!$hasAccess) {
                        return response()->json(['message' => 'Unauthorized'], 403);
                    }
                }
            }
            
            $messages = Message::where('space', $space)
                ->with(['user:id,name,email', 'document'])
                ->orderBy('created_at', 'asc')
                ->limit(100) // Limit to last 100 messages
                ->get()
                ->map(function ($message) {
                    // Handle case where user might be deleted
                    if (!$message->user) {
                        return null;
                    }
                    
                    $data = [
                        'id' => $message->id,
                        'user' => $message->user->name,
                        'user_id' => $message->user->id,
                        'content' => $message->content,
                        'time' => $message->created_at->format('g:i A'),
                        'created_at' => $message->created_at->toISOString(),
                    ];
                    
                    if ($message->document) {
                        $data['document'] = [
                            'id' => $message->document->id,
                            'name' => $message->document->name,
                            'file_type' => $message->document->file_type,
                            'file_size' => $message->document->file_size,
                            'url' => asset('storage/' . $message->document->file_path),
                        ];
                    }
                    
                    return $data;
                })
                ->filter(); // Remove null values

            return response()->json($messages->values());
        } catch (\Exception $e) {
            \Log::error('MessageController@index error: ' . $e->getMessage(), [
                'space' => $space,
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Server Error'], 500);
        }
    }

    /**
     * Get new messages since a timestamp
     */
    public function getNew(Request $request, $space = 'general')
    {
        try {
            $user = $request->user();
            $since = $request->query('since');
            
            // If space is a project (format: project-{id})
            if (str_starts_with($space, 'project-')) {
                $projectId = str_replace('project-', '', $space);
                
                // Check if user has access to this project
                if ($user->role !== 'admin') {
                    $hasAccess = $user->projects()->where('projects.id', $projectId)->exists();
                    if (!$hasAccess) {
                        return response()->json(['message' => 'Unauthorized'], 403);
                    }
                }
            }
            
            $query = Message::where('space', $space)
                ->with(['user:id,name,email', 'document'])
                ->orderBy('created_at', 'asc');

            if ($since) {
                $query->where('created_at', '>', $since);
            }

            $messages = $query->get()->map(function ($message) {
                // Handle case where user might be deleted
                if (!$message->user) {
                    return null;
                }
                
                $data = [
                    'id' => $message->id,
                    'user' => $message->user->name,
                    'user_id' => $message->user->id,
                    'content' => $message->content,
                    'time' => $message->created_at->format('g:i A'),
                    'created_at' => $message->created_at->toISOString(),
                ];
                
                if ($message->document) {
                    $data['document'] = [
                        'id' => $message->document->id,
                        'name' => $message->document->name,
                        'file_type' => $message->document->file_type,
                        'file_size' => $message->document->file_size,
                        'url' => asset('storage/' . $message->document->file_path),
                    ];
                }
                
                return $data;
            })
            ->filter(); // Remove null values

            return response()->json($messages->values());
        } catch (\Exception $e) {
            \Log::error('MessageController@getNew error: ' . $e->getMessage(), [
                'space' => $space,
                'since' => $since,
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Server Error'], 500);
        }
    }

    /**
     * Send a new message
     */
    public function store(Request $request, $space = 'general')
    {
        $user = $request->user();
        
        // If space is a project, check access
        if (str_starts_with($space, 'project-')) {
            $projectId = str_replace('project-', '', $space);
            
            if ($user->role !== 'admin') {
                $hasAccess = $user->projects()->where('projects.id', $projectId)->exists();
                if (!$hasAccess) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }
        }
        
        $validator = Validator::make($request->all(), [
            'content' => 'nullable|string|max:2000',
            'file' => 'nullable|file|max:102400', // 100MB max
            'document_id' => 'nullable|integer|exists:documents,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $documentId = null;
        
        // If document_id is provided directly, use it
        if ($request->has('document_id') && $request->document_id) {
            $documentId = $request->document_id;
        }
        // Otherwise, handle file upload if present
        elseif ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileSize = $file->getSize();
            $fileType = $file->getMimeType();
            $originalName = $file->getClientOriginalName();
            
            // Get project ID from space
            $projectId = null;
            if (str_starts_with($space, 'project-')) {
                $projectId = str_replace('project-', '', $space);
            }
            
            if ($projectId) {
                $path = $file->store("documents/project_{$projectId}", 'public');
                
                $document = Document::create([
                    'project_id' => $projectId,
                    'uploaded_by' => $user->id,
                    'name' => $originalName,
                    'file_path' => $path,
                    'file_type' => $fileType,
                    'file_size' => $fileSize,
                ]);
                
                $documentId = $document->id;
            }
        }
        
        // Validate that we have either content or document
        if (empty($request->content) && !$documentId) {
            return response()->json(['message' => 'Message content or document is required'], 422);
        }

        $message = Message::create([
            'user_id' => $request->user()->id,
            'space' => $space,
            'content' => $request->content ?? '',
            'document_id' => $documentId,
        ]);

        // Load the user and document relationships
        $message->load(['user:id,name,email', 'document']);

        $messageData = [
            'id' => $message->id,
            'user' => $message->user->name,
            'user_id' => $message->user->id,
            'content' => $message->content,
            'time' => $message->created_at->format('g:i A'),
            'created_at' => $message->created_at->toISOString(),
            'space' => $space,
        ];
        
        if ($message->document) {
            $messageData['document'] = [
                'id' => $message->document->id,
                'name' => $message->document->name,
                'file_type' => $message->document->file_type,
                'file_size' => $message->document->file_size,
                'url' => asset('storage/' . $message->document->file_path),
            ];
        }

        // Broadcast the message to WebSocket channel (if configured)
        try {
            if (config('broadcasting.default') !== 'null' && config('broadcasting.default') !== 'log') {
                broadcast(new MessageSent($message))->toOthers();
            }
        } catch (\Exception $e) {
            // Silently fail if broadcasting not configured
            \Log::info('Broadcasting not configured, skipping: ' . $e->getMessage());
        }

        // Create notifications for other users in the chat
        if ($space === 'general') {
            // Notify all users except the sender
            $users = User::where('id', '!=', $user->id)->get();
            foreach ($users as $notifyUser) {
                $notification = Notification::create([
                    'user_id' => $notifyUser->id,
                    'type' => 'message',
                    'title' => 'New Message in General Chat',
                    'message' => "{$user->name}: " . ($message->content ? substr($message->content, 0, 50) : 'Shared a file'),
                    'link' => '/general',
                    'data' => [
                        'message_id' => $message->id,
                        'space' => $space,
                        'sender_name' => $user->name,
                    ],
                    'read' => false,
                ]);

                // Broadcast notification
                try {
                    if (config('broadcasting.default') !== 'null' && config('broadcasting.default') !== 'log') {
                        broadcast(new NotificationBroadcast([
                            'id' => $notification->id,
                            'type' => $notification->type,
                            'title' => $notification->title,
                            'message' => $notification->message,
                            'link' => $notification->link,
                            'data' => $notification->data,
                            'read' => $notification->read,
                            'created_at' => $notification->created_at->toISOString(),
                            'user_id' => $notifyUser->id,
                        ]))->toOthers();
                    }
                } catch (\Exception $e) {
                    \Log::info('Notification broadcast failed: ' . $e->getMessage());
                }
            }
        } elseif (str_starts_with($space, 'project-')) {
            // Notify project members except the sender
            $projectId = str_replace('project-', '', $space);
            $project = Project::with('members')->find($projectId);
            
            if ($project) {
                foreach ($project->members as $member) {
                    if ($member->id !== $user->id) {
                        $notification = Notification::create([
                            'user_id' => $member->id,
                            'type' => 'project_message',
                            'title' => "New Message in {$project->name}",
                            'message' => "{$user->name}: " . ($message->content ? substr($message->content, 0, 50) : 'Shared a file'),
                            'link' => '/project',
                            'data' => [
                                'message_id' => $message->id,
                                'project_id' => $projectId,
                                'project_name' => $project->name,
                                'sender_name' => $user->name,
                            ],
                            'read' => false,
                        ]);

                        // Broadcast notification
                        try {
                            if (config('broadcasting.default') !== 'null' && config('broadcasting.default') !== 'log') {
                                broadcast(new NotificationBroadcast([
                                    'id' => $notification->id,
                                    'type' => $notification->type,
                                    'title' => $notification->title,
                                    'message' => $notification->message,
                                    'link' => $notification->link,
                                    'data' => $notification->data,
                                    'read' => $notification->read,
                                    'created_at' => $notification->created_at->toISOString(),
                                    'user_id' => $member->id,
                                ]))->toOthers();
                            }
                        } catch (\Exception $e) {
                            \Log::info('Notification broadcast failed: ' . $e->getMessage());
                        }
                    }
                }
            }
        }

        return response()->json([
            'message' => 'Message sent successfully',
            'data' => $messageData,
        ], 201);
    }

    /**
     * Delete a message (only the sender can delete)
     */
    public function destroy(Request $request, $space, $id)
    {
        $message = Message::where('space', $space)
            ->where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$message) {
            return response()->json(['message' => 'Message not found or unauthorized'], 404);
        }

        $message->delete();

        return response()->json([
            'message' => 'Message deleted successfully',
        ]);
    }

    public function clearGeneral(Request $request)
    {
        try {
            $user = $request->user();
            
            Log::info('Clearing general messages', [
                'user_id' => $user->id,
                'user_name' => $user->name
            ]);
            
            DB::table('messages')->where('type', 'general')->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'All general messages cleared successfully'
            ]);
        } catch (Exception $e) {
            Log::error('Error clearing general messages: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear messages'
            ], 500);
        }
    }
    
    public function clearProject(Request $request, $projectId)
    {
        try {
            $user = $request->user();
            
            Log::info('Clearing project messages', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'project_id' => $projectId
            ]);
            
            DB::table('messages')
                ->where('type', 'project-' . $projectId)
                ->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'All project messages cleared successfully'
            ]);
        } catch (Exception $e) {
            Log::error('Error clearing project messages: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear messages'
            ], 500);
        }
    }
}
