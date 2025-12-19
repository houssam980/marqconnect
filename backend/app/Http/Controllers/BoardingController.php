<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Project;
use App\Models\BoardingTask;
use App\Models\BoardingDocument;
use App\Models\BoardingLink;

class BoardingController extends Controller
{
    // Check if user has access to project
    private function checkProjectAccess($projectId, $userId, $userRole)
    {
        $project = Project::with('members')->findOrFail($projectId);
        
        // Admin always has access
        if ($userRole === 'admin') {
            return $project;
        }
        
        // Check if user is a member
        $isMember = $project->members->contains('id', $userId);
        
        if (!$isMember) {
            abort(403, 'You do not have access to this project');
        }
        
        return $project;
    }

    // TASKS
    public function getTasks(Request $request, $projectId)
    {
        $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $tasks = BoardingTask::where('project_id', $projectId)
            ->with(['assignedToUser:id,name,email', 'creator:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($tasks);
    }

    public function createTask(Request $request, $projectId)
    {
        $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'required|exists:users,id',
        ]);
        
        $task = BoardingTask::create([
            'project_id' => $projectId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'assigned_to' => $validated['assigned_to'],
            'created_by' => $request->user()->id,
            'status' => 'pending',
        ]);
        
        $task->load(['assignedToUser:id,name,email', 'creator:id,name,email']);
        
        return response()->json($task, 201);
    }

    public function updateTask(Request $request, $projectId, $taskId)
    {
        $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,in_progress,completed',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);
        
        $task = BoardingTask::where('project_id', $projectId)
            ->where('id', $taskId)
            ->firstOrFail();
            
        $task->update($validated);
        $task->load(['assignedToUser:id,name,email', 'creator:id,name,email']);
        
        return response()->json($task);
    }

    // DOCUMENTS
    public function getDocuments(Request $request, $projectId)
    {
        $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $documents = BoardingDocument::where('project_id', $projectId)
            ->with('uploader:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($doc) {
                $doc->url = Storage::url($doc->file_path);
                return $doc;
            });
            
        return response()->json($documents);
    }

    public function uploadDocument(Request $request, $projectId)
    {
        $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $request->validate([
            'document' => 'required|file|max:10240', // 10MB max
        ]);
        
        $file = $request->file('document');
        $originalName = $file->getClientOriginalName();
        $path = $file->store('boarding_documents/' . $projectId, 'public');
        
        $document = BoardingDocument::create([
            'project_id' => $projectId,
            'name' => $originalName,
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);
        
        $document->load('uploader:id,name,email');
        $document->url = Storage::url($document->file_path);
        
        return response()->json($document, 201);
    }

    public function deleteDocument(Request $request, $projectId, $documentId)
    {
        $project = $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $document = BoardingDocument::where('project_id', $projectId)
            ->where('id', $documentId)
            ->firstOrFail();
            
        // Only admin or uploader can delete
        if ($request->user()->role !== 'admin' && $document->uploaded_by !== $request->user()->id) {
            abort(403, 'You cannot delete this document');
        }
        
        // Delete file from storage
        Storage::disk('public')->delete($document->file_path);
        
        $document->delete();
        
        return response()->json(['message' => 'Document deleted successfully']);
    }

    public function downloadDocument(Request $request, $projectId, $documentId)
    {
        $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $document = BoardingDocument::where('project_id', $projectId)
            ->where('id', $documentId)
            ->firstOrFail();
            
        return Storage::disk('public')->download($document->file_path, $document->name);
    }

    // LINKS
    public function getLinks(Request $request, $projectId)
    {
        $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $links = BoardingLink::where('project_id', $projectId)
            ->with('creator:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($links);
    }

    public function createLink(Request $request, $projectId)
    {
        $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'url' => 'required|url',
            'description' => 'nullable|string',
            'type' => 'required|in:helper,inspiration',
        ]);
        
        $link = BoardingLink::create([
            'project_id' => $projectId,
            'title' => $validated['title'],
            'url' => $validated['url'],
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'created_by' => $request->user()->id,
        ]);
        
        $link->load('creator:id,name,email');
        
        return response()->json($link, 201);
    }

    public function deleteLink(Request $request, $projectId, $linkId)
    {
        $project = $this->checkProjectAccess($projectId, $request->user()->id, $request->user()->role);
        
        $link = BoardingLink::where('project_id', $projectId)
            ->where('id', $linkId)
            ->firstOrFail();
            
        // Only admin or creator can delete
        if ($request->user()->role !== 'admin' && $link->created_by !== $request->user()->id) {
            abort(403, 'You cannot delete this link');
        }
        
        $link->delete();
        
        return response()->json(['message' => 'Link deleted successfully']);
    }
}
