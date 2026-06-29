<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Feedback;

class FeedbackController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Feedback::orderBy('created_at', 'desc')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string'
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
        return response()->json(['data' => $feedback]);
    }

    public function destroy(Feedback $feedback)
    {
        $feedback->delete();
        return response()->noContent();
    }
}
