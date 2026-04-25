<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Issue;
use App\Http\Resources\IssueResource;
use Illuminate\Http\Request;

class IssueController extends Controller
{
    public function index()
    {
        return IssueResource::collection(Issue::with('volume.journal')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'volume_id' => 'required|exists:volumes,id',
            'issue_number' => 'required|integer',
            'published_at' => 'nullable|date',
        ]);

        $issue = Issue::create($validated);

        return new IssueResource($issue);
    }

    public function show(Issue $issue)
    {
        return new IssueResource($issue->load('volume.journal'));
    }

    public function update(Request $request, Issue $issue)
    {
        $validated = $request->validate([
            'volume_id' => 'exists:volumes,id',
            'issue_number' => 'integer',
            'published_at' => 'nullable|date',
        ]);

        $issue->update($validated);

        return new IssueResource($issue);
    }

    public function destroy(Issue $issue)
    {
        $issue->delete();

        return response()->noContent();
    }
}
