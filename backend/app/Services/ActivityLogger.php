<?php

namespace App\Services;

use App\Models\ActivityLog;

class ActivityLogger
{
    public static function log($action, $description, $targetType = null, $targetId = null, $userId = null)
    {
        try {
            $resolvedUserId = $userId ?? (auth()->check() ? auth()->id() : null);
            
            if ($resolvedUserId) {
                ActivityLog::create([
                    'user_id' => $resolvedUserId,
                    'action' => $action,
                    'description' => $description,
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('ActivityLogger Error: ' . $e->getMessage());
        }
    }
}
