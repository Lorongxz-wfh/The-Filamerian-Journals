<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;
use App\Models\Article;
use App\Models\Author;
use App\Models\Announcement;
use App\Models\User;

class DashboardController extends Controller
{
    /**
     * Return aggregate stats for the dashboard overview.
     */
    public function stats()
    {
        $recentActivity = \App\Models\ActivityLog::with('user')
            ->latest()
            ->take(5)
            ->get()
            ->map(function($log) {
                return [
                    'action' => $log->action,
                    'target' => $log->description,
                    'time' => $log->created_at->diffForHumans(),
                    'user' => $log->user ? $log->user->name : 'System',
                ];
            });

        return response()->json([
            'journals' => Journal::count(),
            'articles' => Article::count(),
            'authors' => Author::count(),
            'users' => User::count(),
            'announcements' => Announcement::count(),
            'recentActivity' => $recentActivity,
        ]);
    }

    /**
     * Return paginated activity logs for the admin table.
     */
    public function logs()
    {
        $logs = \App\Models\ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }
}
