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

        $metricsData = \Illuminate\Support\Facades\DB::table('article_metrics')
            ->where('date', '>=', $thirtyDaysAgo->copy()->startOfDay())
            ->selectRaw('date, type, sum(count) as total')
            ->groupBy('date', 'type')
            ->get();

        $metricsByDate = [];
        foreach ($metricsData as $metric) {
            $metricsByDate[$metric->date][$metric->type] = $metric->total;
        }

        $chartData = [];
        $websiteChartData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->format('Y-m-d');
            $chartData[] = [
                'date' => \Carbon\Carbon::parse($date)->format('M d'),
                'actions' => $activityCounts[$date] ?? 0
            ];
            
            $websiteChartData[] = [
                'date' => \Carbon\Carbon::parse($date)->format('M d'),
                'views' => $metricsByDate[$date]['view'] ?? 0,
                'downloads' => $metricsByDate[$date]['download'] ?? 0,
            ];
        }

        return response()->json([
            'journals' => Journal::count(),
            'articles' => Article::where('status', 'Published')->count(),
            'drafts' => Article::where('status', 'Draft')->count(),
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
            'chartData' => $chartData,
            'websiteChartData' => $websiteChartData
        ]);
    }

    /**
     * Return paginated activity logs for the admin table.
     */
    public function logs(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\ActivityLog::with('user');

        if ($request->filled('search')) {
            $search = strtolower($request->query('search'));
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(action) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(description) LIKE ?', ["%{$search}%"]);
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(50);

        return response()->json($logs);
    }
}
