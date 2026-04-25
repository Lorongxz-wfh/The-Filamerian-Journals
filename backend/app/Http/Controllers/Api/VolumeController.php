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
        return VolumeResource::collection(Volume::with('journal')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'journal_id' => 'required|exists:journals,id',
            'volume_number' => 'required|integer',
            'year' => 'required|integer',
        ]);

        $volume = Volume::create($validated);

        return new VolumeResource($volume);
    }

    public function show(Volume $volume)
    {
        return new VolumeResource($volume->load('journal'));
    }

    public function update(Request $request, Volume $volume)
    {
        $validated = $request->validate([
            'journal_id' => 'exists:journals,id',
            'volume_number' => 'integer',
            'year' => 'integer',
        ]);

        $volume->update($validated);

        return new VolumeResource($volume);
    }

    public function destroy(Volume $volume)
    {
        $volume->delete();

        return response()->noContent();
    }
}
