<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Http\Resources\ArticleResource;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request)
    {
        $query = Article::with(['volume.journal', 'authors', 'keywords']);

        if ($request->filled('search')) {
            $search = strtolower($request->query('search'));
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(title) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(doi) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('journal_id')) {
            $query->whereHas('volume', function($q) use ($request) {
                $q->where('journal_id', $request->query('journal_id'));
            });
        }

        if ($request->filled('author_id')) {
            $query->whereHas('authors', function($q) use ($request) {
                $q->where('authors.id', $request->query('author_id'));
            });
        }

        $query->orderBy('created_at', 'desc');

        return ArticleResource::collection($query->paginate(50));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'volume_id' => 'required|exists:volumes,id',
            'title' => 'required|string|max:255',
            'abstract' => 'nullable|string',
            'pdf_path' => 'nullable|file|mimes:pdf|max:' . \App\Models\Setting::getMaxPdfUploadSizeKb(),
            'page_start' => 'nullable|integer',
            'page_end' => 'nullable|integer',
            'doi' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:Published,Pending,Revision,Draft',
            'author_ids' => 'nullable|array',
            'author_ids.*' => 'exists:authors,id',
            'author_names' => 'nullable|array',
            'author_names.*' => 'string|max:255',
            'authors' => 'nullable|array',
            'authors.*.first_name' => 'required_with:authors|string|max:255',
            'authors.*.last_name' => 'required_with:authors|string|max:255',
            'authors.*.middle_name' => 'nullable|string|max:255',
            'authors.*.suffix' => 'nullable|string|max:255',
            'keyword_ids' => 'nullable|array',
            'keyword_ids.*' => 'exists:keywords,id',
            'keyword_names' => 'nullable|array',
            'keyword_names.*' => 'string|max:255',
        if ($request->filled('doi')) {
            $doi = trim($request->input('doi'));
            $existingDoi = Article::where('doi', $doi)->first();
            if ($existingDoi) {
                return response()->json([
                    'message' => "An article with DOI '{$doi}' already exists.",
                    'errors' => [
                        'doi' => ["The DOI '{$doi}' is already assigned to another paper."]
                    ]
                ], 422);
            }
        }

        try {
            if ($request->hasFile('pdf_path')) {
                $path = $request->file('pdf_path')->store('articles', config('filesystems.default'));
                $validated['pdf_path'] = $path;
            }
        } catch (\Throwable $e) {
            $reason = $e->getPrevious() ? $e->getPrevious()->getMessage() : $e->getMessage();
            \Illuminate\Support\Facades\Log::error('Article PDF upload error: ' . $reason);
            return response()->json(['message' => 'Article PDF upload failed: ' . $reason], 500);
        }

        $article = Article::create($validated);

        $authorIds = $request->input('author_ids', []);

        if ($request->has('authors') && is_array($request->input('authors'))) {
            foreach ($request->input('authors') as $authorData) {
                if (!empty($authorData['first_name']) && !empty($authorData['last_name'])) {
                    $fullName = trim($authorData['first_name']) . ' ' . trim($authorData['last_name']);
                    
                    // Decode json if stringified form data (in case frontend sends it weirdly)
                    // We assume it's already an array due to validation
                    $author = \App\Models\Author::firstOrCreate(
                        [
                            'first_name' => trim($authorData['first_name']),
                            'last_name' => trim($authorData['last_name'])
                        ],
                        [
                            'name' => $fullName,
                            'middle_name' => isset($authorData['middle_name']) ? trim($authorData['middle_name']) : null,
                            'suffix' => isset($authorData['suffix']) ? trim($authorData['suffix']) : null,
                        ]
                    );
                    $authorIds[] = $author->id;
                }
            }
        } elseif ($request->has('author_names') && is_array($request->input('author_names'))) {
            foreach ($request->input('author_names') as $authorName) {
                if (trim($authorName) !== '') {
                    $author = \App\Models\Author::firstOrCreate(['name' => trim($authorName)]);
                    $authorIds[] = $author->id;
                }
            }
        } elseif (empty($authorIds)) {
            $author = \App\Models\Author::firstOrCreate(['name' => 'The FCU Journals']);
            $authorIds[] = $author->id;
        }

        if (count($authorIds) > 0) {
            $article->authors()->sync($authorIds);
        }

        $keywordIds = $request->input('keyword_ids', []);
        
        if ($request->has('keyword_names') && is_array($request->input('keyword_names'))) {
            foreach ($request->input('keyword_names') as $keywordName) {
                if (trim($keywordName) !== '') {
                    $keyword = \App\Models\Keyword::firstOrCreate(['name' => trim($keywordName)]);
                    $keywordIds[] = $keyword->id;
                }
            }
        }

        if (count($keywordIds) > 0 || $request->has('keyword_names') || $request->has('keyword_ids')) {
            $article->keywords()->sync($keywordIds);
        }

        \App\Services\ActivityLogger::log('Created Article', "Created article: {$article->title}", get_class($article), $article->id);

        return new ArticleResource($article->load(['authors', 'keywords', 'volume.journal']));
    }

    public function show(Article $article)
    {
        return new ArticleResource($article->load(['volume.journal', 'authors', 'keywords']));
    }

    public function showPublic(Article $article)
    {
        // Public endpoint to retrieve article metadata for SEO/Google Scholar
        if ($article->status !== 'Published') {
            abort(404, 'Article not found.');
        }

        $article->load(['volume.journal', 'authors', 'keywords']);

        if ($article->volume && $article->volume->journal && $article->volume->journal->status === 'Draft') {
            abort(404, 'Article not found.');
        }

        return new ArticleResource($article);
    }

    public function getRelated(Article $article)
    {
        // Fetch up to 4 other articles from the same volume
        $related = Article::with(['volume.journal', 'authors'])
            ->where('volume_id', $article->volume_id)
            ->where('id', '!=', $article->id)
            ->where('status', 'Published') // Only show Published articles
            ->whereHas('volume.journal', function ($q) {
                $q->where('status', 'Published');
            })
            ->inRandomOrder()
            ->take(4)
            ->get();
            
        return ArticleResource::collection($related);
    }

    public function getLatest()
    {
        // Fetch the 10 most recently published articles for the carousel
        $latest = Article::with(['volume.journal', 'authors'])
            ->where('status', 'Published')
            ->whereHas('volume.journal', function ($q) {
                $q->where('status', 'Published');
            })
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();
            
        return ArticleResource::collection($latest);
    }

    public function update(Request $request, Article $article)
    {
        $validated = $request->validate([
            'volume_id' => 'exists:volumes,id',
            'title' => 'string|max:255',
            'abstract' => 'nullable|string',
            'pdf_path' => 'nullable|file|mimes:pdf|max:' . \App\Models\Setting::getMaxPdfUploadSizeKb(),
            'page_start' => 'nullable|integer',
            'page_end' => 'nullable|integer',
            'doi' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:Published,Pending,Revision,Draft',
            'author_ids' => 'nullable|array',
            'author_ids.*' => 'exists:authors,id',
            'author_names' => 'nullable|array',
            'author_names.*' => 'string|max:255',
            'authors' => 'nullable|array',
            'authors.*.first_name' => 'required_with:authors|string|max:255',
            'authors.*.last_name' => 'required_with:authors|string|max:255',
            'authors.*.middle_name' => 'nullable|string|max:255',
            'authors.*.suffix' => 'nullable|string|max:255',
            'keyword_ids' => 'nullable|array',
            'keyword_ids.*' => 'exists:keywords,id',
            'keyword_names' => 'nullable|array',
            'keyword_names.*' => 'string|max:255',
        if ($request->filled('doi') && $request->input('doi') !== $article->doi) {
            $doi = trim($request->input('doi'));
            $existingDoi = Article::where('doi', $doi)->where('id', '!=', $article->id)->first();
            if ($existingDoi) {
                return response()->json([
                    'message' => "An article with DOI '{$doi}' already exists.",
                    'errors' => [
                        'doi' => ["The DOI '{$doi}' is already assigned to another paper."]
                    ]
                ], 422);
            }
        }

        try {
            if ($request->hasFile('pdf_path')) {
                // Delete old file
                if ($article->pdf_path) {
                    try {
                        \Illuminate\Support\Facades\Storage::disk(config('filesystems.default'))->delete($article->pdf_path);
                    } catch (\Throwable $t) {}
                }
                $path = $request->file('pdf_path')->store('articles', config('filesystems.default'));
                $validated['pdf_path'] = $path;
            }
        } catch (\Throwable $e) {
            $reason = $e->getPrevious() ? $e->getPrevious()->getMessage() : $e->getMessage();
            \Illuminate\Support\Facades\Log::error('Article PDF update error: ' . $reason);
            return response()->json(['message' => 'Article PDF upload failed: ' . $reason], 500);
        }

        $article->update($validated);

        $authorIds = $request->input('author_ids', []);

        if ($request->has('authors') && is_array($request->input('authors'))) {
            foreach ($request->input('authors') as $authorData) {
                if (!empty($authorData['first_name']) && !empty($authorData['last_name'])) {
                    $fullName = trim($authorData['first_name']) . ' ' . trim($authorData['last_name']);
                    
                    $author = \App\Models\Author::firstOrCreate(
                        [
                            'first_name' => trim($authorData['first_name']),
                            'last_name' => trim($authorData['last_name'])
                        ],
                        [
                            'name' => $fullName,
                            'middle_name' => isset($authorData['middle_name']) ? trim($authorData['middle_name']) : null,
                            'suffix' => isset($authorData['suffix']) ? trim($authorData['suffix']) : null,
                        ]
                    );
                    $authorIds[] = $author->id;
                }
            }
        } elseif ($request->has('author_names') && is_array($request->input('author_names'))) {
            foreach ($request->input('author_names') as $authorName) {
                if (trim($authorName) !== '') {
                    $author = \App\Models\Author::firstOrCreate(['name' => trim($authorName)]);
                    $authorIds[] = $author->id;
                }
            }
        } elseif (empty($authorIds)) {
            $author = \App\Models\Author::firstOrCreate(['name' => 'The FCU Journals']);
            $authorIds[] = $author->id;
        }

        if (count($authorIds) > 0 || $request->has('author_names') || $request->has('author_ids')) {
            $article->authors()->sync($authorIds);
        }

        $keywordIds = $request->input('keyword_ids', []);
        
        if ($request->has('keyword_names') && is_array($request->input('keyword_names'))) {
            foreach ($request->input('keyword_names') as $keywordName) {
                if (trim($keywordName) !== '') {
                    $keyword = \App\Models\Keyword::firstOrCreate(['name' => trim($keywordName)]);
                    $keywordIds[] = $keyword->id;
                }
            }
        }

        if (count($keywordIds) > 0 || $request->has('keyword_names') || $request->has('keyword_ids')) {
            $article->keywords()->sync($keywordIds);
        }

        $changes = [];
        if ($article->wasChanged('title')) $changes[] = "title changed to '{$article->title}'";
        if ($article->wasChanged('status')) $changes[] = "status changed to '{$article->status}'";
        if ($article->wasChanged('volume_id')) {
            $vol = $article->volume;
            $changes[] = "reassigned to Vol. {$vol?->volume_number} ({$vol?->year})";
        }
        if ($article->wasChanged('doi')) $changes[] = "DOI set to '{$article->doi}'";
        if ($article->wasChanged('abstract')) $changes[] = "abstract updated";
        if ($article->wasChanged('page_start') || $article->wasChanged('page_end')) {
            $changes[] = "pages set to pp. {$article->page_start}–{$article->page_end}";
        }
        if ($article->wasChanged('pdf_path')) $changes[] = "uploaded new manuscript PDF";
        if ($request->has('authors') || $request->has('author_names')) $changes[] = "updated author list";
        if ($request->has('keyword_names') || $request->has('keyword_ids')) $changes[] = "updated keywords";

        $details = count($changes) > 0 ? implode(', ', $changes) : 'metadata';
        \App\Services\ActivityLogger::log('Updated Article', "Updated article '{$article->title}': {$details}", get_class($article), $article->id);
        \Illuminate\Support\Facades\Cache::forget('public_settings');

        // Notify admins if status changed
        if ($article->wasChanged('status')) {
            try {
                $otherAdmins = \App\Models\User::role(['Super Admin', 'Admin'])->where('is_disabled', false)->where('id', '!=', auth()->id() ?? 0)->get();
                if ($otherAdmins->isNotEmpty()) {
                    $journalName = $article->volume?->journal?->title ?? 'Journal';
                    $actionVerb = $article->status === 'Published' ? 'published' : 'moved to Draft';
                    \Illuminate\Support\Facades\Notification::send($otherAdmins, new \App\Notifications\SystemNotification(
                        "Article {$article->status}",
                        "'{$article->title}' was {$actionVerb} in {$journalName}.",
                        $article->status === 'Published' ? 'success' : 'warning',
                        '/dashboard/articles'
                    ));
                }
            } catch (\Throwable $t) {}
        }

        return new ArticleResource($article->load(['authors', 'keywords', 'volume.journal']));
    }

    public function destroy(Article $article)
    {
        $title = $article->title;
        $class = get_class($article);

        // Soft delete article (preserve files for potential restore)
        $article->delete();

        \App\Services\ActivityLogger::log('Soft Deleted Article', "Moved article to trash: {$title}", $class, $article->id);
        \Illuminate\Support\Facades\Cache::forget('public_settings');

        try {
            $otherAdmins = \App\Models\User::role(['Super Admin', 'Admin'])->where('is_disabled', false)->where('id', '!=', auth()->id() ?? 0)->get();
            if ($otherAdmins->isNotEmpty()) {
                \Illuminate\Support\Facades\Notification::send($otherAdmins, new \App\Notifications\SystemNotification(
                    'Article Moved to Trash',
                    "'{$title}' was moved to the Trash Bin.",
                    'error',
                    '/dashboard/trash'
                ));
            }
        } catch (\Throwable $t) {}

        return response()->noContent();
    }

    public function getDownloadUrl(Article $article)
    {
        $article->increment('downloads_count');
        
        $metric = \Illuminate\Support\Facades\DB::table('article_metrics')
            ->where('article_id', $article->id)
            ->where('type', 'download')
            ->where('date', now()->toDateString())
            ->first();

        if ($metric) {
            \Illuminate\Support\Facades\DB::table('article_metrics')->where('id', $metric->id)->increment('count');
        } else {
            \Illuminate\Support\Facades\DB::table('article_metrics')->insert([
                'article_id' => $article->id,
                'type' => 'download',
                'date' => now()->toDateString(),
                'count' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (!$article->pdf_path) {
            return response()->json(['message' => 'PDF not found.'], 404);
        }

        return response()->json([
            'url' => url('/api/public/articles/' . $article->id . '/pdf')
        ]);
    }

    public function servePdf(Article $article, \Illuminate\Http\Request $request)
    {
        if (!$article->pdf_path) {
            abort(404, 'PDF not found.');
        }

        $rawPath = $article->pdf_path;
        if (str_starts_with($rawPath, 'http://') || str_starts_with($rawPath, 'https://')) {
            return redirect()->away($rawPath);
        }

        $cleanPath = ltrim(str_replace(['storage/', '/storage/'], '', $rawPath), '/');

        $diskName = config('filesystems.default');
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
            return response()->streamDownload(function () use ($disk, $cleanPath, $article) {
                echo $disk->get($cleanPath);
            }, ($article->title ?? 'article') . '.pdf', $headers);
        }

        try {
            return $disk->response($cleanPath, null, $headers);
        } catch (\Throwable $e) {
            return response()->stream(function () use ($disk, $cleanPath) {
                echo $disk->get($cleanPath);
            }, 200, $headers);
        }
    }

    public function trackView(Article $article)
    {
        $ip = request()->ip();
        $cacheKey = "article_viewed:{$article->id}:{$ip}";

        if (\Illuminate\Support\Facades\Cache::has($cacheKey)) {
            return response()->json(['message' => 'View already recorded recently.']);
        }

        \Illuminate\Support\Facades\Cache::put($cacheKey, true, now()->addHours(1));

        $article->increment('views_count');
        
        $metric = \Illuminate\Support\Facades\DB::table('article_metrics')
            ->where('article_id', $article->id)
            ->where('type', 'view')
            ->where('date', now()->toDateString())
            ->first();

        if ($metric) {
            \Illuminate\Support\Facades\DB::table('article_metrics')->where('id', $metric->id)->increment('count');
        } else {
            \Illuminate\Support\Facades\DB::table('article_metrics')->insert([
                'article_id' => $article->id,
                'type' => 'view',
                'date' => now()->toDateString(),
                'count' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json(['message' => 'View tracked']);
    }
}
