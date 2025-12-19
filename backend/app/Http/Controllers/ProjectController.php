<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    /**
     * Get all projects user has access to
     * - Admins see all projects
     * - Regular users see only projects they're members of
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->role === 'admin') {
            $projects = Project::with(['creator', 'members'])
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $projects = $user->projects()
                ->with(['creator', 'members'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json($projects);
    }

    /**
     * Get a specific project (only if user is a member)
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $project = Project::with(['creator', 'members', 'tasks', 'documents'])->find($id);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Check if user has access
        if ($user->role !== 'admin' && !$project->members->contains($user->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($project);
    }

    /**
     * Create a new project (Admin only)
     */
    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $project = Project::create([
            'created_by' => $request->user()->id,
            'name' => $request->name,
            'description' => $request->description,
        ]);

        // Creator is automatically a member
        $project->members()->attach($request->user()->id, [
            'invited_by' => $request->user()->id,
        ]);

        $project->load(['creator', 'members']);

        return response()->json([
            'message' => 'Project created successfully',
            'project' => $project,
        ], 201);
    }

    /**
     * Update a project (Admin only)
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project = Project::find($id);
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $project->update($request->only(['name', 'description']));
        $project->load(['creator', 'members']);

        return response()->json([
            'message' => 'Project updated successfully',
            'project' => $project,
        ]);
    }

    /**
     * Delete a project (Admin only)
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project = Project::find($id);
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        $project->delete();

        return response()->json(['message' => 'Project deleted successfully']);
    }

    /**
     * Invite users to a project (Admin only)
     */
    public function inviteUsers(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project = Project::find($id);
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Attach users to project
        foreach ($request->user_ids as $userId) {
            $project->members()->syncWithoutDetaching([
                $userId => ['invited_by' => $request->user()->id]
            ]);
        }

        $project->load('members');

        return response()->json([
            'message' => 'Users invited successfully',
            'members' => $project->members,
        ]);
    }

    /**
     * Remove user from project (Admin only)
     */
    public function removeUser(Request $request, $id, $userId)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project = Project::find($id);
        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Don't allow removing the creator
        if ($project->created_by == $userId) {
            return response()->json(['message' => 'Cannot remove project creator'], 400);
        }

        $project->members()->detach($userId);

        return response()->json(['message' => 'User removed from project']);
    }
}
