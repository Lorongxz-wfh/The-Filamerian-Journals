<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;
use App\Http\Resources\JournalResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class JournalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Journal::with('category');

        if ($request->is('api/public/*') || $request->is('public/*')) {
            $query->where('status', 'Published');
        }

        if ($request->filled('search')) {
            $search = strtolower($request->query('search'));
            $query->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"]);
        }

        // Filters
        $category = $request->query('category');
        if (!empty($category)) {
            $categories = array_map('trim', explode(',', $category));
            $query->whereHas('category', function($q) use ($categories) {
                $q->whereIn('slug', $categories)
                  ->orWhereIn('name', $categories);
            });
        }

        $year = $request->query('year');
        if (!empty($year)) {
            $query->whereHas('volumes', function ($q) use ($year) {
                $q->where('year', $year);
            });
        }

        // Eager-load nested relationships when requested
        if ($request->boolean('with_volumes')) {
            $query->with(['volumes.articles' => function ($q) use ($request) {
                if ($request->is('api/public/*') || $request->is('public/*')) {
                    $q->where('status', 'Published');
                }
                $q->orderBy('articles.order', 'asc')->with('authors');
            }]);
        }

        // Standardize pagination to 15
        return JournalResource::collection($query->paginate(15));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'nullable|string|max:255|unique:journals,slug',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'status' => 'nullable|string|in:Published,Draft',
            'publisher' => 'nullable|string|max:255',
            'issn' => 'nullable|string|max:50',
            'frequency' => 'nullable|string|max:100',
            'editor' => 'nullable|string|max:255',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'pdf_path' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        if (empty($validated['status'])) {
            $validated['status'] = 'Published';
        }

        // Auto-generate slug from title if not provided
        if (empty($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        try {
            if ($request->hasFile('cover_image')) {
                $path = $request->file('cover_image')->store('journals/covers', env('FILESYSTEM_DISK', 'public'));
                $validated['cover_image'] = $path;
            }

            if ($request->hasFile('pdf_path')) {
                $path = $request->file('pdf_path')->store('journals/pdfs', env('FILESYSTEM_DISK', 'public'));
                $validated['pdf_path'] = $path;
            }
        } catch (\Throwable $e) {
            $reason = $e->getPrevious() ? $e->getPrevious()->getMessage() : $e->getMessage();
            \Illuminate\Support\Facades\Log::error('Journal file upload error: ' . $reason);
            return response()->json(['message' => 'File storage upload failed: ' . $reason], 500);
        }

        $journal = Journal::create($validated);

        \App\Services\ActivityLogger::log('Created Journal', "Created journal: {$journal->title}", get_class($journal), $journal->id);

        return new JournalResource($journal);
    }

    /**
     * Display the specified resource.
     * Supports both ID and slug lookups.
     */
    public function show(Request $request, $journal)
    {
        if (!($journal instanceof Journal)) {
            $journalModel = is_numeric($journal)
                ? Journal::where('id', $journal)->orWhere('slug', $journal)->first()
                : Journal::where('slug', $journal)->first();
            
            if (!$journalModel) {
                abort(404, 'Journal not found.');
            }
            $journal = $journalModel;
        }

        if (($request->is('api/public/*') || $request->is('public/*')) && $journal->status === 'Draft') {
            abort(404, 'Journal not found.');
        }

        $journal->load(['category', 'volumes.articles' => function ($q) use ($request) {
            if ($request->is('api/public/*') || $request->is('public/*')) {
                $q->where('status', 'Published');
            }
            $q->orderBy('order', 'asc')->with('authors');
        }]);

        return new JournalResource($journal);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Journal $journal)
    {
        $validated = $request->validate([
            'title' => 'string|max:255',
            'slug' => 'string|max:255|unique:journals,slug,' . $journal->id,
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'status' => 'nullable|string|in:Published,Draft',
            'publisher' => 'nullable|string|max:255',
            'issn' => 'nullable|string|max:50',
            'frequency' => 'nullable|string|max:100',
            'editor' => 'nullable|string|max:255',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'pdf_path' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        try {
            if ($request->hasFile('cover_image')) {
                // Delete old image
                if ($journal->cover_image) {
                    try {
                        \Illuminate\Support\Facades\Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($journal->cover_image);
                    } catch (\Throwable $t) {}
                }
                $path = $request->file('cover_image')->store('journals/covers', env('FILESYSTEM_DISK', 'public'));
                $validated['cover_image'] = $path;
            }

            if ($request->hasFile('pdf_path')) {
                // Delete old PDF
                if ($journal->pdf_path) {
                    try {
                        \Illuminate\Support\Facades\Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($journal->pdf_path);
                    } catch (\Throwable $t) {}
                }
                $path = $request->file('pdf_path')->store('journals/pdfs', env('FILESYSTEM_DISK', 'public'));
                $validated['pdf_path'] = $path;
            }
        } catch (\Throwable $e) {
            $reason = $e->getPrevious() ? $e->getPrevious()->getMessage() : $e->getMessage();
            \Illuminate\Support\Facades\Log::error('Journal file update error: ' . $reason);
            return response()->json(['message' => 'File storage upload failed: ' . $reason], 500);
        }

        $journal->update($validated);

        \App\Services\ActivityLogger::log('Updated Journal', "Updated journal: {$journal->title}", get_class($journal), $journal->id);

        return new JournalResource($journal);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Journal $journal)
    {
        // Count total articles associated with volumes of this journal
        $articleCount = \App\Models\Article::whereHas('volume', function($q) use ($journal) {
            $q->where('journal_id', $journal->id);
        })->count();

        if ($articleCount > 0) {
            return response()->json([
                'message' => "Cannot delete '{$journal->title}' because it contains {$articleCount} published/associated article(s). Please unpublish or remove the articles first."
            ], 422);
        }

        // Delete cover image if exists
        if ($journal->cover_image) {
            \Illuminate\Support\Facades\Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($journal->cover_image);
        }

        // Delete PDF if exists
        if ($journal->pdf_path) {
            \Illuminate\Support\Facades\Storage::disk(env('FILESYSTEM_DISK', 'public'))->delete($journal->pdf_path);
        }

        $journal->delete();

        return response()->noContent();
    }

    public function servePdf($journal, Request $request)
    {
        if (!($journal instanceof Journal)) {
            $journalModel = is_numeric($journal)
                ? Journal::where('id', $journal)->orWhere('slug', $journal)->first()
                : Journal::where('slug', $journal)->first();

            if (!$journalModel) {
                abort(404, 'Journal not found.');
            }
            $journal = $journalModel;
        }

        if (!$journal->pdf_path) {
            abort(404, 'Journal PDF not found.');
        }

        $rawPath = $journal->pdf_path;
        if (str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://')) {
            return redirect()->away($rawPath);
        }

        $cleanPath = ltrim(str_replace(['storage/', '/storage/'], '', $rawPath), '/');

        $diskName = env('FILESYSTEM_DISK', 'public');
        $disk = \Illuminate\Support\Facades\Storage::disk($diskName);

        if (!$disk->exists($cleanPath)) {
            if ($diskName !== 'public' && \Illuminate\Support\Facades\Storage::disk('public')->exists($cleanPath)) {
                $disk = \Illuminate\Support\Facades\Storage::disk('public');
                $diskName = 'public';
            } else {
                abort(404, 'PDF file not found on storage server.');
            }
        }

        $headers = [
            'Access-Control-Allow-Origin' => '*',
            'Content-Type' => 'application/pdf',
        ];

        if ($request->query('download')) {
            return response()->streamDownload(function () use ($disk, $cleanPath) {
                echo $disk->get($cleanPath);
            }, ($journal->title ?? 'journal') . '.pdf', $headers);
        }

        try {
            return $disk->response($cleanPath, null, $headers);
        } catch (\Throwable $e) {
            return response()->stream(function () use ($disk, $cleanPath) {
                echo $disk->get($cleanPath);
            }, 200, $headers);
        }
    }
}
