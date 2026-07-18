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

        $now = \Carbon\Carbon::now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $sixtyDaysAgo = $now->copy()->subDays(60);

        $calculateTrend = function($model) use ($thirtyDaysAgo, $sixtyDaysAgo) {
            $recent = $model::where('created_at', '>=', $thirtyDaysAgo)->count();
            $previous = $model::whereBetween('created_at', [$sixtyDaysAgo, $thirtyDaysAgo])->count();

            if ($previous == 0) {
                if ($recent == 0) return ['trend' => 'Stable', 'isPositive' => true];
                return ['trend' => '+100%', 'isPositive' => true];
            }

            $diff = $recent - $previous;
            $percentage = round(($diff / $previous) * 100);

            if ($percentage > 0) return ['trend' => '+' . $percentage . '%', 'isPositive' => true];
            if ($percentage < 0) return ['trend' => $percentage . '%', 'isPositive' => false];
            return ['trend' => 'Stable', 'isPositive' => true];
        };

        $activityCounts = \App\Models\ActivityLog::where('created_at', '>=', $thirtyDaysAgo->copy()->startOfDay())
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->pluck('count', 'date');

        $chartData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->format('Y-m-d');
            $chartData[] = $activityCounts[$date] ?? 0;
        }

        return response()->json([
            'journals' => Journal::count(),
            'articles' => Article::count(),
            'authors' => Author::count(),
            'users' => User::count(),
            'announcements' => Announcement::count(),
            'recentActivity' => $recentActivity,
            'trends' => [
                'journals' => $calculateTrend(Journal::class),
                'articles' => $calculateTrend(Article::class),
                'authors' => $calculateTrend(Author::class),
                'users' => $calculateTrend(User::class),
            ],
            'chartData' => $chartData
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
