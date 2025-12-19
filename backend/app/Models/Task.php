<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    protected $fillable = [
        'user_id',
        'project_id',
        'title',
        'tag',
        'status',
        'priority',
        'date',
        'assignees',
    ];

    protected $casts = [
        'assignees' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedUsers()
    {
        return $this->belongsToMany(User::class, 'task_assignments')
                    ->withPivot('assigned_by')
                    ->withTimestamps();
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
