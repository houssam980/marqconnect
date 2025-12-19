<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'last_seen_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * Check if user is online (active within last 5 minutes)
     */
    public function getIsOnlineAttribute(): bool
    {
        if (!$this->last_seen_at) {
            return false;
        }
        
        return $this->last_seen_at->gt(now()->subMinutes(5));
    }

    /**
     * Get formatted last seen text
     */
    public function getLastSeenTextAttribute(): string
    {
        if (!$this->last_seen_at) {
            return 'Never';
        }

        if ($this->is_online) {
            return 'Online';
        }

        return $this->last_seen_at->diffForHumans();
    }

    /**
     * Get the tasks for the user.
     */
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Get the task statuses for the user.
     */
    public function taskStatuses()
    {
        return $this->hasMany(TaskStatus::class);
    }

    public function assignedTasks()
    {
        return $this->belongsToMany(Task::class, 'task_assignments')
                    ->withPivot('assigned_by')
                    ->withTimestamps();
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_members')
                    ->withPivot('invited_by')
                    ->withTimestamps();
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(UserActivityLog::class);
    }
}
