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

        $rawLogs = \App\Models\ActivityLog::where('created_at', '>=', $thirtyDaysAgo->copy()->startOfDay())->get();
        $activityByCategory = [];
        foreach ($rawLogs as $log) {
            $date = $log->created_at->format('Y-m-d');
            $action = strtolower($log->action ?? '');
            $subject = strtolower($log->subject_type ?? '');

            $cat = 'system';
            if (str_contains($action, 'restore') || str_contains($action, 'purge') || str_contains($action, 'trash') || str_contains($action, 'delete')) {
                $cat = 'trash';
            } elseif (str_contains($subject, 'user') || str_contains($action, 'user') || str_contains($action, 'approved') || str_contains($action, 'disabled') || str_contains($action, 'enabled')) {
                $cat = 'users';
            } elseif (str_contains($subject, 'article') || str_contains($subject, 'journal') || str_contains($subject, 'volume') || str_contains($subject, 'author') || str_contains($subject, 'category') || str_contains($action, 'article') || str_contains($action, 'journal') || str_contains($action, 'publish')) {
                $cat = 'publications';
            }

            if (!isset($activityByCategory[$date])) {
                $activityByCategory[$date] = [
                    'publications' => 0,
                    'users' => 0,
                    'trash' => 0,
                    'system' => 0,
                    'total' => 0,
                ];
            }
            $activityByCategory[$date][$cat]++;
            $activityByCategory[$date]['total']++;
        }

        $metricsData = \Illuminate\Support\Facades\DB::table('article_metrics')
            ->where('date', '>=', $thirtyDaysAgo->copy()->startOfDay())
            ->selectRaw('date, type, sum(count) as total')
            ->groupBy('date', 'type')
            ->get();

        $metricsByDate = [];
        foreach ($metricsData as $metric) {
            $metricsByDate[$metric->date][$metric->type] = (int) $metric->total;
        }

        $chartData = [];
        $websiteChartData = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i)->format('Y-m-d');
            $dayActivity = $activityByCategory[$date] ?? [
                'publications' => 0,
                'users' => 0,
                'trash' => 0,
                'system' => 0,
                'total' => 0,
            ];

            $chartData[] = [
                'date' => \Carbon\Carbon::parse($date)->format('M d'),
                'publications' => $dayActivity['publications'],
                'users' => $dayActivity['users'],
                'trash' => $dayActivity['trash'],
                'system' => $dayActivity['system'],
                'actions' => $dayActivity['total'],
            ];
            
            $websiteChartData[] = [
                'date' => \Carbon\Carbon::parse($date)->format('M d'),
                'views' => $metricsByDate[$date]['view'] ?? 0,
                'downloads' => $metricsByDate[$date]['download'] ?? 0,
            ];
        }

        $vercelData = null;
        $vercelToken = env('VERCEL_ANALYTICS_TOKEN');
        if ($vercelToken) {
            try {
                $response = \Illuminate\Support\Facades\Http::withToken($vercelToken)
                    ->timeout(5)
                    ->get('https://api.vercel.com/v6/deployments', [
                        'limit' => 5
                    ]);

                if ($response->successful()) {
                    $deps = $response->json('deployments') ?? [];
                    $latest = $deps[0] ?? null;
                    $vercelData = [
                        'status' => 'Connected',
                        'latest_deployment' => $latest ? [
                            'url' => $latest['url'] ?? '',
                            'state' => $latest['state'] ?? 'READY',
                            'branch' => $latest['meta']['githubCommitRef'] ?? 'main',
                            'commit_msg' => $latest['meta']['githubCommitMessage'] ?? '',
                            'created_at' => isset($latest['created']) ? \Carbon\Carbon::createFromTimestampMs($latest['created'])->diffForHumans() : '',
                        ] : null,
                        'recent_deployments' => array_map(function($d) {
                            return [
                                'id' => $d['uid'] ?? '',
                                'url' => $d['url'] ?? '',
                                'branch' => $d['meta']['githubCommitRef'] ?? 'main',
                                'commit_msg' => $d['meta']['githubCommitMessage'] ?? '',
                                'state' => $d['state'] ?? 'READY',
                                'created_at' => isset($d['created']) ? \Carbon\Carbon::createFromTimestampMs($d['created'])->diffForHumans() : '',
                            ];
                        }, array_slice($deps, 0, 3)),
                    ];
                }
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Vercel API fetch failed: ' . $e->getMessage());
            }
        }

        // Category breakdown calculation (by active journals)
        $categoryBreakdown = collect();
        $topArticlesData = collect();
        $topAuthorsData = collect();

        try {
            $categories = \App\Models\Category::withCount('journals')->get();
            $totalJournalsCount = Journal::count();
            $categoryBreakdown = $categories->map(function($cat) use ($totalJournalsCount) {
                $count = $cat->journals_count;
                $percentage = $totalJournalsCount > 0 ? round(($count / $totalJournalsCount) * 100) : 0;
                return [
                    'name' => $cat->name,
                    'count' => $count,
                    'percentage' => $percentage,
                ];
            })->sortByDesc('count')->values();

            // Top Read Articles (Full Ranked List)
            $topArticlesData = Article::where('status', 'Published')
                ->with(['volume.journal'])
                ->select('articles.*')
                ->selectSub(function($query) {
                    $query->from('article_metrics')
                          ->selectRaw('COALESCE(SUM(count), 0)')
                          ->whereColumn('article_metrics.article_id', 'articles.id');
                }, 'total_views')
                ->orderBy('total_views', 'desc')
                ->get()
                ->map(function($art) {
                    return [
                        'id' => $art->id,
                        'title' => $art->title,
                        'journal' => $art->volume && $art->volume->journal ? $art->volume->journal->title : 'Academic Repository',
                        'views' => (int) ($art->total_views ?? 0),
                        'published_date' => $art->created_at ? $art->created_at->format('M Y') : '2025',
                    ];
                });

            // Top Contributing Authors (Full Ranked List)
            $topAuthorsData = Author::withCount('articles')
                ->orderBy('articles_count', 'desc')
                ->get()
                ->map(function($aut) {
                    return [
                        'name' => trim($aut->first_name . ' ' . $aut->last_name),
                        'papers' => $aut->articles_count,
                        'department' => $aut->email && str_contains($aut->email, '@') ? explode('@', $aut->email)[1] : 'Faculty Research',
                    ];
                });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Analytics stats calculation error: ' . $e->getMessage());
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
            'websiteChartData' => $websiteChartData,
            'categoryBreakdown' => $categoryBreakdown,
            'topArticles' => $topArticlesData,
            'topAuthors' => $topAuthorsData,
            'vercel' => $vercelData
        ]);
    }

    /**
     * Return paginated activity logs for the admin table.
     */
    public function logs(\Illuminate\Http\Request $request)
    {
        $query = \App\Models\ActivityLog::with('user');

        if ($request->filled('action') && $request->query('action') !== 'all') {
            $actionFilter = strtolower($request->query('action'));
            $query->whereRaw('LOWER(action) LIKE ?', ["%{$actionFilter}%"]);
        }

        if ($request->filled('period') && $request->query('period') !== 'all') {
            $period = $request->query('period');
            if ($period === 'today') {
                $query->whereDate('created_at', \Carbon\Carbon::today());
            } elseif ($period === '7days') {
                $query->where('created_at', '>=', \Carbon\Carbon::now()->subDays(7));
            } elseif ($period === '30days') {
                $query->where('created_at', '>=', \Carbon\Carbon::now()->subDays(30));
            }
        }

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
