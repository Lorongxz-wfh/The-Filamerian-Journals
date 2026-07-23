<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Feedback;

class FeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = Feedback::orderBy('created_at', 'desc');
        return response()->json($query->paginate(50));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'category' => 'required|string|in:System Issue,Journal Suggestion,Other',
            'message' => 'required|string|max:2000'
        ]);

        $feedback = Feedback::create($validated);
        return response()->json(['data' => $feedback], 201);
    }

    public function update(Request $request, Feedback $feedback)
    {
        $validated = $request->validate([
            'is_read' => 'boolean'
        ]);

        $feedback->update($validated);

        \App\Services\ActivityLogger::log('Updated Feedback', "Updated feedback status from {$feedback->name}", get_class($feedback), $feedback->id);

        return response()->json(['data' => $feedback]);
    }

    public function destroy(Feedback $feedback)
    {
        $name = $feedback->name;
        $class = get_class($feedback);

        $feedback->delete();

        \App\Services\ActivityLogger::log('Deleted Feedback', "Deleted feedback from {$name}", $class, null);

        return response()->noContent();
    }
}
