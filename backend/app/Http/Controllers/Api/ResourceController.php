<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => \App\Models\Resource::orderBy('order', 'asc')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:resources',
            'content' => 'nullable|string',
            'order' => 'integer'
        ]);

        $resource = \App\Models\Resource::create($validated);
        return response()->json(['data' => $resource], 201);
    }

    public function show(\App\Models\Resource $resource)
    {
        return response()->json(['data' => $resource]);
    }

    public function update(Request $request, \App\Models\Resource $resource)
    {
        $validated = $request->validate([
            'title' => 'string|max:255',
            'slug' => 'string|max:255|unique:resources,slug,' . $resource->id,
            'content' => 'nullable|string',
            'order' => 'integer'
        ]);

        $resource->update($validated);
        return response()->json(['data' => $resource]);
    }

    public function destroy(\App\Models\Resource $resource)
    {
        $resource->delete();
        return response()->noContent();
    }
}
