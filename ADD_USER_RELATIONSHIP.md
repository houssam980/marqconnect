# Add to User Model

Add this relationship method to the User model in:
`C:\wamp64\www\marqconnect_backend\app\Models\User.php`

```php
/**
 * Get the user's activity logs
 */
public function activityLogs()
{
    return $this->hasMany(UserActivityLog::class);
}
```

This should be added inside the User class, typically after other relationship methods.
