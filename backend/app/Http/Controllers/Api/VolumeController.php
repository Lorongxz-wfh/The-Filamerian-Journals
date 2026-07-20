<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Volume;
use App\Http\Resources\VolumeResource;
use Illuminate\Http\Request;

class VolumeController extends Controller
{
    public function index()
    {
        return VolumeResource::collection(Volume::with('journal')->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'journal_id' => 'required|exists:journals,id',
            'volume_number' => 'required|string',
            'year' => 'required|integer',
        ]);

        $volume = Volume::create($validated);

        \App\Services\ActivityLogger::log('Created Volume', "Created volume number {$volume->volume_number} for journal ID {$volume->journal_id}", get_class($volume), $volume->id);

        return new VolumeResource($volume);
    }

    public function show(Volume $volume)
    {
        return new VolumeResource($volume->load(['journal', 'articles' => function($query) {
            $query->orderBy('order', 'asc')->with('authors', 'keywords');
        }]));
    }

    public function reorderArticles(Request $request, Volume $volume)
    {
        $validated = $request->validate([
            'article_ids' => 'required|array',
            'article_ids.*' => 'exists:articles,id',
        ]);

        foreach ($validated['article_ids'] as $index => $id) {
            \App\Models\Article::where('id', $id)->where('volume_id', $volume->id)->update(['order' => $index]);
        }

        \App\Services\ActivityLogger::log('Reordered Articles', "Reordered articles in volume {$volume->volume_number}", get_class($volume), $volume->id);

        return response()->json(['message' => 'Articles reordered successfully']);
    }

    public function update(Request $request, Volume $volume)
    {
        $validated = $request->validate([
            'journal_id' => 'exists:journals,id',
            'volume_number' => 'string',
            'year' => 'integer',
        ]);

        $volume->update($validated);

        \App\Services\ActivityLogger::log('Updated Volume', "Updated volume number {$volume->volume_number}", get_class($volume), $volume->id);

        return new VolumeResource($volume);
    }

    public function destroy(Volume $volume)
    {
        $desc = "Deleted volume number {$volume->volume_number}";
        $class = get_class($volume);

        $volume->delete();

        \App\Services\ActivityLogger::log('Deleted Volume', $desc, $class, null);

        return response()->noContent();
    }
}
