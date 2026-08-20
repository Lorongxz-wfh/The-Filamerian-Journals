<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Feedback;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = Feedback::orderBy('created_at', 'desc');

        if ($request->has('archived') && $request->archived == 'true') {
            $query->where('is_archived', true);
        } else {
            $query->where('is_archived', false);
        }

        $paginated = $query->paginate(50);
        $paginated->appends(['unread_count' => Feedback::where('is_archived', false)->where('is_read', false)->count()]);

        return response()->json($paginated);
    }

    public function unreadCount()
    {
        $count = Feedback::where('is_archived', false)->where('is_read', false)->count();
        return response()->json(['unread_count' => $count]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'category' => 'required|string|in:System Issue,Journal Suggestion,Other',
            'message' => 'required|string|max:2000'
        ]);

        $feedback = Feedback::create($validated);

        try {
            $admins = \App\Models\User::role(['Super Admin', 'Admin'])->where('is_disabled', false)->get();
            if ($admins->isNotEmpty()) {
                \Illuminate\Support\Facades\Notification::send($admins, new \App\Notifications\SystemNotification(
                    'New Feedback Received',
                    "New {$feedback->category} from {$feedback->name}: \"{$feedback->subject}\"",
                    'info',
                    '/dashboard/feedback'
                ));
            }
        } catch (\Throwable $t) {}

        return response()->json(['data' => $feedback], 201);
    }

    public function update(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'is_read' => 'nullable|boolean',
            'is_archived' => 'nullable|boolean',
        ]);

        $feedback->update($validated);

        \App\Services\ActivityLogger::log('Updated Feedback', "Updated feedback status from {$feedback->name}", get_class($feedback), $feedback->id);

        return response()->json(['data' => $feedback]);
    }

    public function destroy(Feedback $feedback)
    {
        $name = $feedback->name;
        $class = get_class($feedback);

        $feedback->delete();

        \App\Services\ActivityLogger::log('Deleted Feedback', "Deleted feedback from {$name}", $class, null);

        return response()->noContent();
    }
}
