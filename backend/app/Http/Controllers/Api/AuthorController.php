<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Http\Resources\AuthorResource;
use Illuminate\Http\Request;

class AuthorController extends Controller
{
    public function index(Request $request)
    {
        $query = Author::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                  ->orWhere('last_name', 'like', "%{$s}%")
                  ->orWhere('middle_name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        $sortBy  = in_array($request->sort_by, ['first_name', 'last_name', 'email', 'created_at']) ? $request->sort_by : 'last_name';
        $sortDir = $request->sort_dir === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $perPage = min((int) ($request->per_page ?? 15), 100);

        return AuthorResource::collection($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:authors,email',
        ]);

        $author = Author::create($validated);

        return new AuthorResource($author);
    }

    public function show(Author $author)
    {
        return new AuthorResource($author);
    }

    public function update(Request $request, Author $author)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => 'nullable|email|unique:authors,email,' . $author->id,
        ]);

        $author->update($validated);

        return new AuthorResource($author);
    }

    public function destroy(Author $author)
    {
        $author->delete();

        return response()->noContent();
    }
}
