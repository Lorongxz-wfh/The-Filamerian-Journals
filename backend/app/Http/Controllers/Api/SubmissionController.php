<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Submission;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole(['Super Admin', 'Editor'])) {
            return Submission::with(['user', 'journal', 'reviews.reviewer'])->latest()->get();
        }
        return Submission::with(['journal', 'reviews'])->where('user_id', $user->id)->latest()->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'abstract' => 'nullable|string',
            'journal_id' => 'nullable|exists:journals,id',
            'pdf' => 'required|file|mimes:pdf|max:10240',
        ]);

        $path = $request->file('pdf')->store('submissions', 'public');

        $submission = Submission::create([
            'user_id' => $request->user()->id,
            'journal_id' => $request->journal_id,
            'title' => $request->title,
            'abstract' => $request->abstract,
            'manuscript_path' => $path,
            'status' => 'pending',
        ]);

        if (!$request->user()->hasRole('Author')) {
            $request->user()->assignRole('Author');
        }

        return response()->json($submission, 201);
    }

    public function show(Submission $submission, Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole(['Super Admin', 'Editor']) && $user->id !== $submission->user_id) {
            abort(403, 'Unauthorized.');
        }
        return $submission->load(['user', 'journal', 'reviews.reviewer']);
    }

    public function update(Request $request, Submission $submission)
    {
        $request->validate([
            'status' => 'sometimes|in:pending,under_review,revisions_required,accepted,rejected',
        ]);

        if ($request->has('status')) {
            $submission->update(['status' => $request->status]);
        }

        return response()->json($submission);
    }

    public function assignReviewer(Request $request, Submission $submission)
    {
        $request->validate([
            'reviewer_id' => 'required|exists:users,id'
        ]);

        $reviewer = \App\Models\User::findOrFail($request->reviewer_id);

        if (!$reviewer->hasRole('Reviewer')) {
            $reviewer->assignRole('Reviewer');
        }

        $review = \App\Models\Review::create([
            'submission_id' => $submission->id,
            'reviewer_id' => $reviewer->id,
        ]);

        $submission->update(['status' => 'under_review']);

        return response()->json($review, 201);
    }
}
