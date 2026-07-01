<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Review;

class ReviewController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole(['Super Admin', 'Editor'])) {
            return Review::with(['submission', 'reviewer'])->latest()->get();
        }
        return Review::with('submission')->where('reviewer_id', $user->id)->latest()->get();
    }

    public function show(Review $review, Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole(['Super Admin', 'Editor']) && $user->id !== $review->reviewer_id) {
            abort(403, 'Unauthorized.');
        }
        return $review->load(['submission', 'reviewer']);
    }

    public function update(Request $request, Review $review)
    {
        $user = $request->user();
        if (!$user->hasRole(['Super Admin', 'Editor']) && $user->id !== $review->reviewer_id) {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'comments' => 'nullable|string',
            'recommendation' => 'nullable|in:approve,reject,revise',
        ]);

        $review->update($request->only(['comments', 'recommendation']));

        return response()->json($review);
    }
}
