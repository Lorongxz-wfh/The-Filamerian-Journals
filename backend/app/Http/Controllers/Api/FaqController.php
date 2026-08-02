<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    /**
     * Public list of published FAQs.
     */
    public function publicIndex(Request $request)
    {
        $query = Faq::where('is_published', true);

        if ($request->has('category') && $request->category !== 'All') {
            $query->where('category', $request->category);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                  ->orWhere('answer', 'like', "%{$search}%");
            });
        }

        $faqs = $query->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $faqs
        ]);
    }

    /**
     * Admin list of all FAQs (including unpublished).
     */
    public function index(Request $request)
    {
        $query = Faq::query();

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                  ->orWhere('answer', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $faqs = $query->orderBy('sort_order', 'asc')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $faqs
        ]);
    }

    /**
     * Store a new FAQ item.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'category' => 'required|string|max:50',
            'audience' => 'nullable|string|in:all,public,admin',
            'sort_order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $faq = Faq::create([
            'question' => $validated['question'],
            'answer' => $validated['answer'],
            'category' => $validated['category'],
            'audience' => $validated['audience'] ?? 'all',
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_published' => $validated['is_published'] ?? true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'FAQ created successfully.',
            'data' => $faq
        ], 201);
    }

    /**
     * Display a specific FAQ item.
     */
    public function show(Faq $faq)
    {
        return response()->json([
            'status' => 'success',
            'data' => $faq
        ]);
    }

    /**
     * Update an FAQ item.
     */
    public function update(Request $request, Faq $faq)
    {
        $validated = $request->validate([
            'question' => 'sometimes|required|string|max:255',
            'answer' => 'sometimes|required|string',
            'category' => 'sometimes|required|string|max:50',
            'audience' => 'nullable|string|in:all,public,admin',
            'sort_order' => 'nullable|integer',
            'is_published' => 'nullable|boolean',
        ]);

        $faq->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'FAQ updated successfully.',
            'data' => $faq
        ]);
    }

    /**
     * Remove an FAQ item.
     */
    public function destroy(Faq $faq)
    {
        $faq->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'FAQ deleted successfully.'
        ]);
    }
}
