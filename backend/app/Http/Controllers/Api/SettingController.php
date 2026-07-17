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
        // Return settings as a key-value object with infinite cache
        $settings = Cache::rememberForever('public_settings', function () {
            return Setting::all()->pluck('value', 'key');
        });
        return response()->json(['data' => $settings]);
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

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
