<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Category::withCount('journals')->orderBy('order', 'asc')->orderBy('id', 'asc')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories',
            'slug' => 'nullable|string|max:255|unique:categories',
            'description' => 'nullable|string',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $maxOrder = Category::max('order') ?? 0;
        $validated['order'] = $maxOrder + 1;

        $category = Category::create($validated);

        return response()->json(['data' => $category], 201);
    }

    public function show(Category $category)
    {
        return response()->json(['data' => $category]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'slug' => 'nullable|string|max:255|unique:categories,slug,' . $category->id,
            'description' => 'nullable|string',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }

        $category->update($validated);

        return response()->json(['data' => $category]);
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'category_ids' => 'required|array',
            'category_ids.*' => 'exists:categories,id',
        ]);

        foreach ($validated['category_ids'] as $index => $id) {
            Category::where('id', $id)->update(['order' => $index]);
        }

        \App\Services\ActivityLogger::log('Reordered Categories', 'Reordered categories list', Category::class, null);

        return response()->json(['message' => 'Categories reordered successfully']);
    }

    public function destroy(Category $category)
    {
        $journalCount = $category->journals()->count();
        if ($journalCount > 0) {
            return response()->json([
                'message' => "Cannot delete category '{$category->name}' because it is assigned to {$journalCount} journal(s). Please reassign or remove the associated journals first."
            ], 422);
        }

        \App\Services\ActivityLogger::log('Deleted Category', "Deleted category '{$category->name}'", Category::class, $category->id);
        $category->delete();
        return response()->noContent();
    }
}
