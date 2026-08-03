<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    /**
     * Public index for public website visitors.
     */
    public function publicIndex(Request $request)
    {
        $query = Faq::where('is_published', true)
            ->whereIn('audience', ['all', 'public']);

        if ($request->filled('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                  ->orWhere('answer', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc')->get());
    }

    /**
     * Admin/Staff index (returns all FAQs).
     */
    public function index(Request $request)
    {
        $query = Faq::query();

        if ($request->filled('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        if ($request->filled('audience') && $request->audience !== 'All') {
            $query->where('audience', $request->audience);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                  ->orWhere('answer', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc')->get());
    }

    /**
     * Store a newly created FAQ in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:500',
            'answer' => 'required|string',
            'category' => 'nullable|string|max:100',
            'audience' => 'nullable|string|in:all,public,staff',
            'sort_order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $validated['category'] = $validated['category'] ?? 'General';
        $validated['audience'] = $validated['audience'] ?? 'all';
        $validated['sort_order'] = $validated['sort_order'] ?? 0;
        $validated['is_published'] = $validated['is_published'] ?? true;

        $faq = Faq::create($validated);

        return response()->json([
            'message' => 'FAQ item created successfully.',
            'faq' => $faq,
        ], 201);
    }

    /**
     * Display the specified FAQ.
     */
    public function show(Faq $faq)
    {
        return response()->json($faq);
    }

    /**
     * Update the specified FAQ in storage.
     */
    public function update(Request $request, Faq $faq)
    {
        $validated = $request->validate([
            'question' => 'sometimes|required|string|max:500',
            'answer' => 'sometimes|required|string',
            'category' => 'nullable|string|max:100',
            'audience' => 'nullable|string|in:all,public,staff',
            'sort_order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $faq->update($validated);

        return response()->json([
            'message' => 'FAQ item updated successfully.',
            'faq' => $faq,
        ]);
    }

    /**
     * Remove the specified FAQ from storage.
     */
    public function destroy(Faq $faq)
    {
        $faq->delete();

        return response()->json([
            'message' => 'FAQ item deleted successfully.',
        ]);
    }
}
