<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DocumentController extends Controller
{
    /**
     * Get all documents for a project
     */
    public function index(Request $request, $project_id)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            
            $project = Project::with('members')->find($project_id);

            if (!$project) {
                return response()->json(['message' => 'Project not found'], 404);
            }

            // Check if user has access
            if ($user->role !== 'admin') {
                $hasAccess = $project->members()->where('user_id', $user->id)->exists();
                if (!$hasAccess) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $documents = Document::where('project_id', $project_id)
                ->with('uploader:id,name')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($doc) {
                    // Handle case where uploader might be deleted
                    $uploaderName = 'Unknown';
                    if ($doc->uploader) {
                        $uploaderName = $doc->uploader->name;
                    }
                    
                    return [
                        'id' => $doc->id,
                        'name' => $doc->name,
                        'file_path' => $doc->file_path,
                        'file_type' => $doc->file_type,
                        'file_size' => $doc->file_size,
                        'url' => asset('storage/' . $doc->file_path),
                        'uploaded_by' => $uploaderName,
                        'created_at' => $doc->created_at->toISOString(),
                    ];
                });

            return response()->json($documents);
        } catch (\Exception $e) {
            \Log::error('DocumentController@index error: ' . $e->getMessage(), [
                'project_id' => $project_id,
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Server Error'], 500);
        }
    }

    /**
     * Upload a document to a project
     */
    public function store(Request $request, $project_id)
    {
        $user = $request->user();
        $project = Project::find($project_id);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Check if user has access
        if ($user->role !== 'admin') {
            $hasAccess = $project->members()->where('user_id', $user->id)->exists();
            if (!$hasAccess) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:102400', // 100MB max
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $file = $request->file('file');
        $fileSize = $file->getSize();
        $fileType = $file->getMimeType();
        $originalName = $file->getClientOriginalName();

        // Store file in storage/app/public/documents/project_{id}/
        $path = $file->store("documents/project_{$project_id}", 'public');

        $document = Document::create([
            'project_id' => $project_id,
            'uploaded_by' => $user->id,
            'name' => $originalName,
            'file_path' => $path,
            'file_type' => $fileType,
            'file_size' => $fileSize,
        ]);

        $document->load('uploader:id,name');

        return response()->json([
            'message' => 'Document uploaded successfully',
            'document' => [
                'id' => $document->id,
                'name' => $document->name,
                'file_path' => $document->file_path,
                'file_type' => $document->file_type,
                'file_size' => $document->file_size,
                'url' => asset('storage/' . $document->file_path),
                'uploaded_by' => $document->uploader->name ?? 'Unknown',
                'created_at' => $document->created_at->toISOString(),
            ],
        ], 201);
    }

    /**
     * Delete a document
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::find($id);

        if (!$document) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        $project = $document->project;

        // Check if user has access (admin or document uploader)
        if ($user->role !== 'admin' && $document->uploaded_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete file from storage
        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }
}
