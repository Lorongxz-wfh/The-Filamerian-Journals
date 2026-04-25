<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;
use App\Http\Resources\JournalResource;
use Illuminate\Http\Request;

class JournalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return JournalResource::collection(Journal::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('journals', 'public');
            $validated['cover_image'] = $path;
        }

        $journal = Journal::create($validated);

        return new JournalResource($journal);
    }

    /**
     * Display the specified resource.
     */
    public function show(Journal $journal)
    {
        return new JournalResource($journal);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Journal $journal)
    {
        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('cover_image')) {
            // Delete old image
            if ($journal->cover_image) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($journal->cover_image);
            }
            $path = $request->file('cover_image')->store('journals', 'public');
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
        $journal->delete();

        return response()->noContent();
    }
}
