<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Feedback;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = Feedback::query();

        if ($request->has('archived') && $request->archived == 'true') {
            $query->where('is_archived', true);
        } else {
            $query->where('is_archived', false);
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->search) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('email', 'like', $search)
                  ->orWhere('subject', 'like', $search)
                  ->orWhere('message', 'like', $search);
            });
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        if ($request->filled('date_preset')) {
            switch ($request->date_preset) {
                case 'today':
                    $query->whereDate('created_at', now()->toDateString());
                    break;
                case 'last_7_days':
                    $query->whereDate('created_at', '>=', now()->subDays(7)->toDateString());
                    break;
                case 'this_month':
                    $query->whereDate('created_at', '>=', now()->startOfMonth()->toDateString());
                    break;
                case 'last_30_days':
                    $query->whereDate('created_at', '>=', now()->subDays(30)->toDateString());
                    break;
                case 'this_year':
                    $query->whereDate('created_at', '>=', now()->startOfYear()->toDateString());
                    break;
            }
        }

        $sortField = $request->input('sort_by', 'created_at');
        $sortDirection = strtolower($request->input('sort_dir', 'desc')) === 'asc' ? 'asc' : 'desc';
        if (in_array($sortField, ['created_at', 'name', 'email', 'category', 'subject', 'is_read'])) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = $request->input('per_page', 50);
        if ($perPage === 'all' || $perPage == -1) {
            $items = $query->get();
            return response()->json([
                'data' => $items,
                'total' => $items->count(),
                'unread_count' => Feedback::where('is_archived', false)->where('is_read', false)->count()
            ]);
        }

        $paginated = $query->paginate(is_numeric($perPage) ? (int)$perPage : 50);
        $paginated->appends([
            'unread_count' => Feedback::where('is_archived', false)->where('is_read', false)->count()
        ]);

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
            'category' => 'required|string|max:100',
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
