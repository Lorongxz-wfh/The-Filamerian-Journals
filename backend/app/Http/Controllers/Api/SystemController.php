<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class SystemController extends Controller
{
    public function health()
    {
        try {
            DB::connection()->getPdo();
            $dbStatus = 'Connected';
            
            $driver = DB::connection()->getDriverName();
            $dbSizeBytes = 0;

            if ($driver === 'sqlite') {
                $dbPath = DB::connection()->getDatabaseName();
                if (File::exists($dbPath)) {
                    $dbSizeBytes = File::size($dbPath);
                }
            } else if ($driver === 'mysql') {
                $dbName = DB::connection()->getDatabaseName();
                $dbSizeResult = DB::select("
                    SELECT SUM(data_length + index_length) as size 
                    FROM information_schema.TABLES 
                    WHERE table_schema = ?
                ", [$dbName]);
                $dbSizeBytes = (int) ($dbSizeResult[0]->size ?? 0);
            } else if ($driver === 'pgsql') {
                $dbSizeResult = DB::select("SELECT pg_database_size(current_database()) as size");
                $dbSizeBytes = (int) ($dbSizeResult[0]->size ?? 0);
            }
            
            $counts = [
                'articles' => \App\Models\Article::count(),
                'journals' => \App\Models\Journal::count(),
                'users' => \App\Models\User::count(),
                'activity_logs' => \App\Models\ActivityLog::count(),
            ];
        } catch (\Exception $e) {
            $dbStatus = 'Disconnected';
            $dbSizeBytes = 0;
            $counts = [
                'articles' => 0,
                'journals' => 0,
                'users' => 0,
                'activity_logs' => 0,
            ];
        }

        // Disk space
        $storagePath = storage_path();
        $totalDisk = @disk_total_space($storagePath) ?: 0;
        $freeDisk = @disk_free_space($storagePath) ?: 0;
        $usedDisk = max(0, $totalDisk - $freeDisk);
        $diskPercentage = $totalDisk > 0 ? round(($usedDisk / $totalDisk) * 100, 1) : 0;

        // Recent logs
        $logPath = storage_path('logs/laravel.log');
        $recentLogs = [];
        if (File::exists($logPath)) {
            $rawContent = File::get($logPath);
            $lines = array_filter(explode("\n", trim($rawContent)));
            $recentLogs = array_slice(array_values($lines), -80);
        }

        // Cloudflare R2 info
        $r2Bucket = env('R2_BUCKET', '');
        $r2Status = env('FILESYSTEM_DISK') === 'r2' ? 'Active' : 'Inactive';

        return response()->json([
            'status' => 'Operational',
            'php_version' => phpversion(),
            'laravel_version' => app()->version(),
            'database' => $dbStatus,
            'database_size_bytes' => $dbSizeBytes,
            'counts' => $counts,
            'storage_disk' => env('FILESYSTEM_DISK', 'local'),
            'r2' => [
                'status' => $r2Status,
                'bucket' => $r2Bucket,
            ],
            'disk' => [
                'total_bytes' => $totalDisk,
                'free_bytes' => $freeDisk,
                'used_bytes' => $usedDisk,
                'percentage' => $diskPercentage,
            ],
            'recent_logs' => $recentLogs,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function clearLogs()
    {
        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            File::put($logPath, '');
        }

        return response()->json(['message' => 'System logs cleared successfully.']);
    }
}
