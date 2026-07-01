<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SystemController extends Controller
{
    public function health()
    {
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            $dbStatus = 'Connected';
        } catch (\Exception $e) {
            $dbStatus = 'Disconnected';
        }

        return response()->json([
            'status' => 'Operational',
            'php_version' => phpversion(),
            'database' => $dbStatus,
            'storage_disk' => env('FILESYSTEM_DISK', 'local'),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
