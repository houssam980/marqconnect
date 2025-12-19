# Project Boarding System - Backend Setup Guide

## Database Migrations

Create these migration files in your Laravel backend:

### 1. boarding_tasks table
```bash
php artisan make:migration create_boarding_tasks_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('boarding_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('assigned_to')->constrained('users')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamps();
            
            $table->index(['project_id', 'assigned_to']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('boarding_tasks');
    }
};
```

### 2. boarding_documents table
```bash
php artisan make:migration create_boarding_documents_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('boarding_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index('project_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('boarding_documents');
    }
};
```

### 3. boarding_links table
```bash
php artisan make:migration create_boarding_links_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('boarding_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('title');
            $table->text('url');
            $table->text('description')->nullable();
            $table->enum('type', ['helper', 'inspiration'])->default('helper');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['project_id', 'type']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('boarding_links');
    }
};
```

## Run Migrations
```bash
php artisan migrate
```

## Create Controller

Create the BoardingController:

```bash
php artisan make:controller BoardingController
```

File: `app/Http/Controllers/BoardingController.php`

```php
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
```

## Create Models

### BoardingTask Model
```bash
php artisan make:model BoardingTask
```

File: `app/Models/BoardingTask.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoardingTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'assigned_to',
        'created_by',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignedToUser()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
```

### BoardingDocument Model
```bash
php artisan make:model BoardingDocument
```

File: `app/Models/BoardingDocument.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoardingDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'file_path',
        'file_type',
        'file_size',
        'uploaded_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
```

### BoardingLink Model
```bash
php artisan make:model BoardingLink
```

File: `app/Models/BoardingLink.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoardingLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'url',
        'description',
        'type',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
```

## Add Routes

Add these routes to `routes/api.php`:

```php
// Boarding System Routes
Route::middleware('auth:sanctum')->group(function () {
    // Tasks
    Route::get('/projects/{project}/boarding/tasks', [BoardingController::class, 'getTasks']);
    Route::post('/projects/{project}/boarding/tasks', [BoardingController::class, 'createTask']);
    Route::put('/projects/{project}/boarding/tasks/{task}', [BoardingController::class, 'updateTask']);
    
    // Documents
    Route::get('/projects/{project}/boarding/documents', [BoardingController::class, 'getDocuments']);
    Route::post('/projects/{project}/boarding/documents', [BoardingController::class, 'uploadDocument']);
    Route::delete('/projects/{project}/boarding/documents/{document}', [BoardingController::class, 'deleteDocument']);
    Route::get('/projects/{project}/boarding/documents/{document}/download', [BoardingController::class, 'downloadDocument']);
    
    // Links
    Route::get('/projects/{project}/boarding/links', [BoardingController::class, 'getLinks']);
    Route::post('/projects/{project}/boarding/links', [BoardingController::class, 'createLink']);
    Route::delete('/projects/{project}/boarding/links/{link}', [BoardingController::class, 'deleteLink']);
});
```

## Testing

After setting up everything, test the boarding system:

1. Navigate to a project in your app
2. Click the "Boarding" tab
3. Try creating tasks, uploading documents, and adding links
4. Verify that only project members can see the boarding content
5. Test that admins can delete any content while regular users can only delete their own

## Features Summary

✅ **Tasks**: Assign tasks to team members with status tracking (pending, in progress, completed)
✅ **Documents**: Upload and manage project documents (max 10MB per file)
✅ **Helper Links**: Add useful resource links for the team
✅ **Inspiration Links**: Add inspiring design/idea references
✅ **Access Control**: Only project members and admins can access boarding content
✅ **Delete Permissions**: Admins can delete anything, users can delete their own content

## File Storage Configuration

Make sure your Laravel `config/filesystems.php` has the public disk configured:

```php
'public' => [
    'driver' => 'local',
    'root' => storage_path('app/public'),
    'url' => env('APP_URL').'/storage',
    'visibility' => 'public',
],
```

And create the storage link:
```bash
php artisan storage:link
```
