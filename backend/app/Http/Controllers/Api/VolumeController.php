<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Volume;
use App\Http\Resources\VolumeResource;
use Illuminate\Http\Request;

class VolumeController extends Controller
{
    public function index(Request $request)
    {
        $query = Volume::with('journal');

        if ($request->has('journal_id') && $request->journal_id) {
            $query->where('journal_id', $request->journal_id);
            return VolumeResource::collection($query->get());
        }

        return VolumeResource::collection($query->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'journal_id' => 'required|exists:journals,id',
            'volume_number' => 'required|string',
            'year' => 'required|integer',
        ]);

        $volume = Volume::create($validated);
        $journalTitle = $volume->journal?->title ?? "Journal #{$volume->journal_id}";

        \App\Services\ActivityLogger::log('Created Volume', "Created Volume {$volume->volume_number} ({$volume->year}) for '{$journalTitle}'", get_class($volume), $volume->id);

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

        $count = count($validated['article_ids']);
        $journalTitle = $volume->journal?->title ?? "Journal #{$volume->journal_id}";
        \App\Services\ActivityLogger::log('Reordered Articles', "Reordered {$count} article(s) in Volume {$volume->volume_number} ({$volume->year}) of '{$journalTitle}'", get_class($volume), $volume->id);

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
        $journalTitle = $volume->journal?->title ?? "Journal #{$volume->journal_id}";

        \App\Services\ActivityLogger::log('Updated Volume', "Updated Volume {$volume->volume_number} ({$volume->year}) of '{$journalTitle}'", get_class($volume), $volume->id);

        return new VolumeResource($volume);
    }

    public function destroy(Volume $volume)
    {
        $articleCount = $volume->articles()->count();
        $journalTitle = $volume->journal?->title ?? "Journal #{$volume->journal_id}";

        \Illuminate\Support\Facades\DB::transaction(function () use ($volume) {
            // Soft delete all active articles in this volume
            $volume->articles()->delete();
            // Soft delete the volume itself
            $volume->delete();
        });

        $desc = "Moved Volume {$volume->volume_number} ({$volume->year}) and {$articleCount} article(s) of '{$journalTitle}' to trash";
        $class = get_class($volume);

        \App\Services\ActivityLogger::log('Soft Deleted Volume', $desc, $class, $volume->id);

        return response()->noContent();
    }
}
