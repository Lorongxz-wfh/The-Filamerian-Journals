<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;
use App\Http\Resources\JournalResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class JournalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Journal::query();

        // Eager-load nested relationships when requested
        if ($request->boolean('with_volumes')) {
            $query->with(['volumes.issues.articles.authors']);
        }

        return JournalResource::collection($query->paginate(50));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:journals,slug',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'issn' => 'nullable|string|max:50',
            'frequency' => 'nullable|string|max:100',
            'editor' => 'nullable|string|max:255',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        // Auto-generate slug from title if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('journals', env('FILESYSTEM_DISK', 'public'));
            $validated['cover_image'] = $path;
        }

        $journal = Journal::create($validated);

        return new JournalResource($journal);
    }

    /**
     * Display the specified resource.
     * Supports both ID and slug lookups.
     */
    public function show(Journal $journal)
    {
        $journal->load(['volumes.issues.articles.authors']);

        return new JournalResource($journal);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Journal $journal)
    {
        $validated = $request->validate([
            'title' => 'string|max:255',
            'slug' => 'string|max:255|unique:journals,slug,' . $journal->id,
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100',
            'issn' => 'nullable|string|max:50',
            'frequency' => 'nullable|string|max:100',
            'editor' => 'nullable|string|max:255',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        if ($request->hasFile('cover_image')) {
            // Delete old image
            if ($journal->cover_image_path) {
                \Illuminate\Support\Facades\Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($journal->cover_image_path);
            }
            $path = $request->file('cover_image')->store('journals', env('FILESYSTEM_DISK', 'public'));
            $validated['cover_image'] = $path;
        }

        $journal->update($validated);

        return new JournalResource($journal);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Journal $journal)
    {
        // Delete cover image if exists
        if ($journal->cover_image) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($journal->cover_image);
        }

        $journal->delete();

        return response()->noContent();
    }
}
