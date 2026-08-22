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
        $query = Journal::with('category')->withCount(['volumes', 'articles']);

        if ($request->is('api/public/*') || $request->is('public/*')) {
            $query->where(function($q) {
                $q->where('status', 'Published')
                  ->orWhereNull('status');
            });
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
            $query->with(['volumes.articles' => function($q) use ($request) {
                if ($request->is('api/public/*') || $request->is('public/*')) {
                    $q->where('status', 'Published');
                }
                $q->orderBy('order', 'asc')->orderBy('id', 'asc')->with('authors');
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
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg|max:' . \App\Models\Setting::getMaxImageUploadSizeKb(),
            'pdf_path' => 'nullable|file|mimes:pdf|max:' . \App\Models\Setting::getMaxPdfUploadSizeKb(),
        $title = trim($request->input('title', ''));
        if ($title !== '') {
            $existingActive = Journal::where('title', $title)->first();
            if ($existingActive) {
                return response()->json([
                    'message' => "A journal titled '{$title}' already exists.",
                    'errors' => [
                        'title' => ["A journal titled '{$title}' already exists."]
                    ]
                ], 422);
            }

            $existingTrashed = Journal::onlyTrashed()->where('title', $title)->first();
            if ($existingTrashed) {
                return response()->json([
                    'message' => "A journal titled '{$title}' is currently in the Trash Bin. You can restore it from Trash or choose a different title.",
                    'errors' => [
                        'title' => ["A journal with this title is currently in the Trash Bin."]
                    ]
                ], 422);
            }
        }

        if (empty($validated['status'])) {
            $validated['status'] = 'Published';
        }

        // Auto-generate unique slug from title if not provided, or validate unique
        if (empty($validated['slug'])) {
            $baseSlug = Str::slug($validated['title'] ?: 'journal');
            $slug = $baseSlug;
            $counter = 1;
            while (Journal::withTrashed()->where('slug', $slug)->exists()) {
                $counter++;
                $slug = "{$baseSlug}-{$counter}";
            }
            $validated['slug'] = $slug;
        } else {
            $slugCheck = Journal::withTrashed()->where('slug', $validated['slug'])->first();
            if ($slugCheck) {
                $inTrash = $slugCheck->trashed() ? ' (currently in the Trash Bin)' : '';
                return response()->json([
                    'message' => "The web address (slug) '{$validated['slug']}' is already in use{$inTrash}.",
                    'errors' => [
                        'slug' => ["The slug '{$validated['slug']}' is already in use{$inTrash}."]
                    ]
                ], 422);
            }
        }

        try {
            if ($request->hasFile('cover_image')) {
                $path = $request->file('cover_image')->store('journals/covers', config('filesystems.default'));
                $validated['cover_image'] = $path;
            }

            if ($request->hasFile('pdf_path')) {
                $path = $request->file('pdf_path')->store('journals/pdfs', config('filesystems.default'));
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

        $journal->load(['category', 'volumes.articles' => function($q) use ($request) {
            if ($request->is('api/public/*') || $request->is('public/*')) {
                $q->where('status', 'Published');
            }
            $q->orderBy('order', 'asc')->orderBy('id', 'asc')->with('authors');
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
            'slug' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'status' => 'nullable|string|in:Published,Draft',
            'publisher' => 'nullable|string|max:255',
            'issn' => 'nullable|string|max:50',
            'frequency' => 'nullable|string|max:100',
            'editor' => 'nullable|string|max:255',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg|max:' . \App\Models\Setting::getMaxImageUploadSizeKb(),
            'pdf_path' => 'nullable|file|mimes:pdf|max:' . \App\Models\Setting::getMaxPdfUploadSizeKb(),
        ]);

        if ($request->filled('title') && $request->input('title') !== $journal->title) {
            $title = trim($request->input('title'));
            $existingActive = Journal::where('title', $title)->where('id', '!=', $journal->id)->first();
            if ($existingActive) {
                return response()->json([
                    'message' => "A journal titled '{$title}' already exists.",
                    'errors' => [
                        'title' => ["A journal titled '{$title}' already exists."]
                    ]
                ], 422);
            }

            $existingTrashed = Journal::onlyTrashed()->where('title', $title)->where('id', '!=', $journal->id)->first();
            if ($existingTrashed) {
                return response()->json([
                    'message' => "A journal titled '{$title}' is currently in the Trash Bin. You can restore it from Trash or choose a different title.",
                    'errors' => [
                        'title' => ["A journal with this title is currently in the Trash Bin."]
                    ]
                ], 422);
            }
        }

        if ($request->filled('slug') && $request->input('slug') !== $journal->slug) {
            $slugCheck = Journal::withTrashed()->where('slug', $request->input('slug'))->where('id', '!=', $journal->id)->first();
            if ($slugCheck) {
                $inTrash = $slugCheck->trashed() ? ' (currently in the Trash Bin)' : '';
                return response()->json([
                    'message' => "The web address (slug) '{$request->input('slug')}' is already in use{$inTrash}.",
                    'errors' => [
                        'slug' => ["The slug '{$request->input('slug')}' is already in use{$inTrash}."]
                    ]
                ], 422);
            }
        }

        try {
            if ($request->hasFile('cover_image')) {
                // Delete old image
                if ($journal->cover_image) {
                    try {
                        \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'))->delete($journal->cover_image);
                    } catch (\Throwable $t) {}
                }
                $path = $request->file('cover_image')->store('journals/covers', config('filesystems.default'));
                $validated['cover_image'] = $path;
            }

            if ($request->hasFile('pdf_path')) {
                // Delete old PDF
                if ($journal->pdf_path) {
                    try {
                        \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'))->delete($journal->pdf_path);
                    } catch (\Throwable $t) {}
                }
                $path = $request->file('pdf_path')->store('journals/pdfs', config('filesystems.default'));
                $validated['pdf_path'] = $path;
            }
        } catch (\Throwable $e) {
            $reason = $e->getPrevious() ? $e->getPrevious()->getMessage() : $e->getMessage();
            \Illuminate\Support\Facades\Log::error('Journal file update error: ' . $reason);
            return response()->json(['message' => 'File storage upload failed: ' . $reason], 500);
        }

        $oldStatus = $journal->status;
        $journal->update($validated);

        // If journal is updated to Draft, cascade Draft status to all its articles
        if (isset($validated['status']) && $validated['status'] === 'Draft' && $oldStatus !== 'Draft') {
            $volumeIds = $journal->volumes()->pluck('id');
            $articleCount = 0;
            if ($volumeIds->isNotEmpty()) {
                $articleCount = \App\Models\Article::whereIn('volume_id', $volumeIds)->update(['status' => 'Draft']);
            }
            \App\Services\ActivityLogger::log('Unpublished Journal', "Unpublished journal '{$journal->title}' (status set to Draft, cascaded {$articleCount} article(s) to Draft)", get_class($journal), $journal->id);
            try {
                $otherAdmins = \App\Models\User::role(['Super Admin', 'Admin'])->where('is_disabled', false)->where('id', '!=', auth()->id() ?? 0)->get();
                if ($otherAdmins->isNotEmpty()) {
                    \Illuminate\Support\Facades\Notification::send($otherAdmins, new \App\Notifications\SystemNotification(
                        'Journal Unpublished',
                        "'{$journal->title}' was unpublished and set to Draft.",
                        'warning',
                        "/dashboard/journals/{$journal->slug}"
                    ));
                }
            } catch (\Throwable $t) {}
        } elseif (isset($validated['status']) && $validated['status'] === 'Published' && $oldStatus !== 'Published') {
            \App\Services\ActivityLogger::log('Published Journal', "Published journal '{$journal->title}' (made publicly visible)", get_class($journal), $journal->id);
            try {
                $otherAdmins = \App\Models\User::role(['Super Admin', 'Admin'])->where('is_disabled', false)->where('id', '!=', auth()->id() ?? 0)->get();
                if ($otherAdmins->isNotEmpty()) {
                    \Illuminate\Support\Facades\Notification::send($otherAdmins, new \App\Notifications\SystemNotification(
                        'Journal Published',
                        "'{$journal->title}' is now live and published on the portal.",
                        'success',
                        "/dashboard/journals/{$journal->slug}"
                    ));
                }
            } catch (\Throwable $t) {}
        } else {
            $changes = [];
            if ($journal->wasChanged('title')) $changes[] = "title changed to '{$journal->title}'";
            if ($journal->wasChanged('category_id')) {
                $catName = $journal->category?->name ?? 'None';
                $changes[] = "category set to '{$catName}'";
            }
            if ($journal->wasChanged('editor')) $changes[] = "editor set to '{$journal->editor}'";
            if ($journal->wasChanged('issn')) $changes[] = "ISSN set to '{$journal->issn}'";
            if ($journal->wasChanged('frequency')) $changes[] = "frequency set to '{$journal->frequency}'";
            if ($journal->wasChanged('publisher')) $changes[] = "year/publisher set to '{$journal->publisher}'";
            if ($journal->wasChanged('description')) $changes[] = "description updated";
            if ($journal->wasChanged('cover_image')) $changes[] = "uploaded new cover image";
            if ($journal->wasChanged('pdf_path')) $changes[] = "uploaded new PDF document";

            $details = count($changes) > 0 ? implode(', ', $changes) : 'metadata';
            \App\Services\ActivityLogger::log('Updated Journal', "Updated journal '{$journal->title}': {$details}", get_class($journal), $journal->id);
        }

        return new JournalResource($journal);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Journal $journal)
    {
        // Cascade soft-delete all articles inside volumes of this journal
        $volumeIds = $journal->volumes()->pluck('id');
        $volumeCount = $volumeIds->count();
        $articleCount = 0;
        if ($volumeIds->isNotEmpty()) {
            $articleCount = \App\Models\Article::whereIn('volume_id', $volumeIds)->count();
            \App\Models\Article::whereIn('volume_id', $volumeIds)->delete();
            $journal->volumes()->delete();
        }

        // Soft delete journal (preserve files for potential restore from Trash Bin)
        $journal->delete();

        \App\Services\ActivityLogger::log('Soft Deleted Journal', "Moved journal '{$journal->title}' ({$volumeCount} volume(s), {$articleCount} article(s)) to trash", get_class($journal), $journal->id);

        try {
            $otherAdmins = \App\Models\User::role(['Super Admin', 'Admin'])->where('is_disabled', false)->where('id', '!=', auth()->id() ?? 0)->get();
            if ($otherAdmins->isNotEmpty()) {
                \Illuminate\Support\Facades\Notification::send($otherAdmins, new \App\Notifications\SystemNotification(
                    'Journal Moved to Trash',
                    "'{$journal->title}' and all its volumes/articles were moved to the Trash Bin.",
                    'error',
                    '/dashboard/trash'
                ));
            }
        } catch (\Throwable $t) {}

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
            'Cache-Control' => 'public, max-age=3600, must-revalidate',
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

    public function serveCover($journal, Request $request)
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

        if (!$journal->cover_image) {
            abort(404, 'Journal cover image not found.');
        }

        $rawPath = $journal->cover_image;
        if (str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://')) {
            return redirect()->away($rawPath);
        }

        $cleanPath = ltrim(str_replace(['storage/', '/storage/'], '', $rawPath), '/');

        $diskName = config('filesystems.default');
        $disk = \Illuminate\Support\Facades\Storage::disk($diskName);

        if (!$disk->exists($cleanPath)) {
            if ($diskName !== 'public' && \Illuminate\Support\Facades\Storage::disk('public')->exists($cleanPath)) {
                $disk = \Illuminate\Support\Facades\Storage::disk('public');
            } else {
                abort(404, 'Cover image file not found on storage server.');
            }
        }

        $mimeType = 'image/jpeg';
        try {
            $mimeType = $disk->mimeType($cleanPath) ?: 'image/jpeg';
        } catch (\Throwable $t) {}

        $headers = [
            'Access-Control-Allow-Origin' => '*',
            'Content-Type' => $mimeType,
            'Cache-Control' => 'public, max-age=3600, must-revalidate',
        ];

        try {
            return $disk->response($cleanPath, null, $headers);
        } catch (\Throwable $e) {
            return response()->stream(function () use ($disk, $cleanPath) {
                echo $disk->get($cleanPath);
            }, 200, $headers);
        }
    }
}
