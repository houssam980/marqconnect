<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $space;

    public function __construct(Message $messageModel)
    {
        $this->space = $messageModel->space;
        $this->message = [
            'id' => $messageModel->id,
            'user' => $messageModel->user->name,
            'user_id' => $messageModel->user->id,
            'content' => $messageModel->content,
            'time' => $messageModel->created_at->format('g:i A'),
            'created_at' => $messageModel->created_at->toISOString(),
        ];
    }

    public function broadcastOn(): Channel
    {
        return new Channel('chat.' . $this->space);
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}

