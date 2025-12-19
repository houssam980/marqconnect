
    /**
     * Delete a user (Admin only)
     */
    public function destroy(Request $request, $id)
    {
        try {
            $user = $request->user();

            // Check if user is authenticated
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Check if user is admin
            if (!$user->role || $user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Prevent self-deletion
            if ($user->id == $id) {
                return response()->json(['message' => 'Cannot delete your own account'], 400);
            }

            $userToDelete = User::find($id);

            if (!$userToDelete) {
                return response()->json(['message' => 'User not found'], 404);
            }

            $userToDelete->delete();

            Log::info('User deleted', [
                'deleted_user_id' => $id,
                'deleted_by' => $user->id,
            ]);

            return response()->json(['message' => 'User deleted successfully']);
        } catch (\Exception $e) {
            Log::error('UserController@destroy error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'target_user_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['message' => 'Failed to delete user', 'error' => $e->getMessage()], 500);
        }
    }
}
