<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Http\Resources\ArticleResource;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index()
    {
        return ArticleResource::collection(Article::with(['volume.journal', 'authors', 'keywords'])->paginate(50));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'volume_id' => 'required|exists:volumes,id',
            'title' => 'required|string|max:255',
            'abstract' => 'nullable|string',
            'pdf_path' => 'nullable|file|mimes:pdf|max:10240', // 10MB max
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
        ]);

        if ($request->hasFile('pdf_path')) {
            $path = $request->file('pdf_path')->store('articles', 'public');
            $validated['pdf_path'] = $path;
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
            $author = \App\Models\Author::firstOrCreate(['name' => 'The Filamerian Journals']);
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
        return new ArticleResource($article->load(['volume.journal', 'authors', 'keywords']));
    }

    public function getRelated(Article $article)
    {
        // Fetch up to 4 other articles from the same volume
        $related = Article::with(['volume.journal', 'authors'])
            ->where('volume_id', $article->volume_id)
            ->where('id', '!=', $article->id)
            ->where('status', 'published') // Assuming we only show published
            ->inRandomOrder()
            ->take(4)
            ->get();
            
        return ArticleResource::collection($related);
    }

    public function getLatest()
    {
        // Fetch the 10 most recently published articles for the carousel
        $latest = Article::with(['volume.journal', 'authors'])
            ->where('status', 'published')
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
            'pdf_path' => 'nullable|file|mimes:pdf|max:10240',
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
        ]);

        if ($request->hasFile('pdf_path')) {
            // Delete old file
            if ($article->pdf_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($article->pdf_path);
            }
            $path = $request->file('pdf_path')->store('articles', 'public');
            $validated['pdf_path'] = $path;
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
            $author = \App\Models\Author::firstOrCreate(['name' => 'The Filamerian Journals']);
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

        return new ArticleResource($article->load(['authors', 'keywords', 'volume.journal']));
    }

    public function destroy(Article $article)
    {
        // Delete PDF if exists
        if ($article->pdf_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($article->pdf_path);
        }

        $article->delete();

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
            'url' => \Illuminate\Support\Facades\Storage::disk('public')->url($article->pdf_path)
        ]);
    }

    public function servePdf(Article $article)
    {
        if (!$article->pdf_path || !\Illuminate\Support\Facades\Storage::disk('public')->exists($article->pdf_path)) {
            abort(404, 'PDF not found.');
        }

        $path = \Illuminate\Support\Facades\Storage::disk('public')->path($article->pdf_path);
        
        return response()->file($path, [
            'Access-Control-Allow-Origin' => '*',
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function trackView(Article $article)
    {
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
