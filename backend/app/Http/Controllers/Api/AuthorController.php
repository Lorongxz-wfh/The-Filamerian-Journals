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
            'first_name' => 'required_without:name|nullable|string|max:255',
            'last_name' => 'required_without:name|nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:authors,email',
        ]);

        if (empty($validated['name']) && (!empty($validated['first_name']) || !empty($validated['last_name']))) {
            $parts = [];
            if (!empty($validated['last_name'])) $parts[] = $validated['last_name'] . ',';
            if (!empty($validated['first_name'])) $parts[] = $validated['first_name'];
            if (!empty($validated['middle_name'])) {
                $parts[] = mb_substr(trim($validated['middle_name']), 0, 1) . '.';
            }
            if (!empty($validated['suffix'])) $parts[] = $validated['suffix'];
            $validated['name'] = implode(' ', $parts);
        }

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
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'suffix' => 'nullable|string|max:255',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:authors,email,' . $author->id,
        ]);

        $firstName = $validated['first_name'] ?? $author->first_name;
        $lastName = $validated['last_name'] ?? $author->last_name;
        $middleName = $validated['middle_name'] ?? $author->middle_name;
        $suffix = $validated['suffix'] ?? $author->suffix;

        if (empty($validated['name']) && ($firstName || $lastName)) {
            $parts = [];
            if ($lastName) $parts[] = $lastName . ',';
            if ($firstName) $parts[] = $firstName;
            if ($middleName) $parts[] = mb_substr(trim($middleName), 0, 1) . '.';
            if ($suffix) $parts[] = $suffix;
            $validated['name'] = implode(' ', $parts);
        }

        $author->update($validated);

        return new AuthorResource($author);
    }

    public function destroy(Author $author)
    {
        $author->delete();

        return response()->noContent();
    }
}
