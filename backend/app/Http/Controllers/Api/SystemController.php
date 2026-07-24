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
        $dbStatus = 'Disconnected';
        $dbDriver = 'Unknown';
        $dbType = 'Unknown';
        $dbHostDisplay = '';
        $dbSizeBytes = 0;
        $counts = [
            'articles' => 0,
            'journals' => 0,
            'users' => 0,
            'activity_logs' => 0,
        ];

        try {
            DB::connection()->getPdo();
            $dbStatus = 'Connected';
            
            $driver = DB::connection()->getDriverName();
            
            // Map driver names to nice labels
            $dbDriver = match($driver) {
                'sqlite' => 'SQLite',
                'mysql' => 'MySQL',
                'pgsql' => 'PostgreSQL',
                default => ucfirst($driver)
            };

            $host = DB::connection()->getConfig('host') ?? '';
            
            if ($driver === 'sqlite' || $host === '127.0.0.1' || $host === 'localhost') {
                $dbType = 'Local';
                $dbHostDisplay = $driver === 'sqlite' ? 'Local Database File' : 'Localhost';
            } else {
                $dbType = 'Cloud';
                if (str_contains($host, 'neon.tech')) {
                    $dbHostDisplay = 'Neon Postgres';
                } else if (str_contains($host, 'render.com')) {
                    $dbHostDisplay = 'Render Postgres';
                } else if (str_contains($host, 'supabase.co') || str_contains($host, 'supabase.net')) {
                    $dbHostDisplay = 'Supabase Postgres';
                } else if (str_contains($host, 'rds.amazonaws.com')) {
                    $dbHostDisplay = 'AWS RDS';
                } else {
                    $dbHostDisplay = 'External Postgres';
                }
            }

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
        }

        // Storage Info
        $storageDisk = env('FILESYSTEM_DISK', 'local');
        $storageType = match($storageDisk) {
            'r2' => 'Cloudflare R2',
            's3' => 'AWS S3',
            'public', 'local' => 'Local File Storage',
            default => ucfirst($storageDisk) . ' Storage'
        };
        $r2Bucket = env('R2_BUCKET', '');

        // Backend Provider
        $backendProvider = env('RENDER') || env('RENDER_SERVICE_ID') ? 'Render Cloud' : (app()->isLocal() ? 'Local Server' : 'Cloud Server');

        // Calculate total storage size (cached for 10 seconds for real-time updates)
        $storageSizeBytes = \Illuminate\Support\Facades\Cache::remember('storage_total_size', 10, function () use ($storageDisk) {
            $totalSize = 0;
            try {
                $disk = \Illuminate\Support\Facades\Storage::disk($storageDisk);
                $files = $disk->allFiles();
                foreach ($files as $file) {
                    // Skip hidden files
                    if (str_starts_with(basename($file), '.')) continue;
                    $totalSize += $disk->size($file);
                }
            } catch (\Exception $e) {
                // Fallback
            }
            return $totalSize;
        });

        return response()->json([
            'status' => 'Operational',
            'backend_provider' => $backendProvider,
            'php_version' => phpversion(),
            'laravel_version' => app()->version(),
            'database' => [
                'status' => $dbStatus,
                'driver' => $dbDriver,
                'type' => $dbType,
                'host' => $dbHostDisplay,
                'size_bytes' => $dbSizeBytes,
            ],
            'storage' => [
                'disk' => $storageDisk,
                'type' => $storageType,
                'bucket' => $r2Bucket,
                'size_bytes' => $storageSizeBytes,
            ],
            'counts' => $counts,
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
