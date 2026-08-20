<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;

use Illuminate\Support\Facades\Cache;

class SettingController extends Controller
{
    public function index()
    {
        try {
            $settings = Cache::remember('public_settings', 3600, function () {
                return Setting::all()->pluck('value', 'key');
            });
            return response()->json(['data' => $settings]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Settings fetch error: ' . $e->getMessage());
            return response()->json(['data' => (object)[]]);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'nullable|string'
        ]);

        $changedSettings = [];
        foreach ($validated['settings'] as $key => $value) {
            $existing = Setting::where('key', $key)->value('value');
            if ($existing !== (string)$value) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );
                $label = ucwords(str_replace('_', ' ', $key));
                $fromVal = ($existing !== null && $existing !== '') ? $existing : 'none';
                $toVal = ($value !== null && $value !== '') ? $value : 'none';
                $changedSettings[] = "{$label} ({$fromVal} ➔ {$toVal})";
            }
        }

        // Clear the cache whenever settings are saved
        Cache::forget('public_settings');

        $desc = count($changedSettings) > 0
            ? 'Updated settings: ' . implode(', ', array_slice($changedSettings, 0, 4)) . (count($changedSettings) > 4 ? ' and ' . (count($changedSettings) - 4) . ' more' : '')
            : 'Saved system settings';

        \App\Services\ActivityLogger::log('Updated System Settings', $desc, \App\Models\Setting::class, null);

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
