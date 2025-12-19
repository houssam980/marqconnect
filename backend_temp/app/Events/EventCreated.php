<?php

namespace App\Events;

use App\Models\Event;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EventCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;

    public function __construct($notificationData)
    {
        $this->notification = $notificationData;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->notification['user_id']),
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.received';
    }
}
