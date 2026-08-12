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

        foreach ($validated['settings'] as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        // Clear the cache whenever settings are saved
        Cache::forget('public_settings');

        \App\Services\ActivityLogger::log('Updated Website Settings', 'Updated website layout & configuration settings', \App\Models\Setting::class, null);

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
