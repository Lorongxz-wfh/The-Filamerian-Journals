<?php

namespace App\Services;

use App\Models\ActivityLog;

class ActivityLogger
{
    public static function log($action, $description, $targetType = null, $targetId = null)
    {
        if (auth()->check()) {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'action' => $action,
                'description' => $description,
                'target_type' => $targetType,
                'target_id' => $targetId,
            ]);
        }
    }
}
