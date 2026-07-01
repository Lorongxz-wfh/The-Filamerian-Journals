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
        return ArticleResource::collection(Article::with(['issue.volume.journal', 'authors', 'keywords'])->paginate(50));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'issue_id' => 'required|exists:issues,id',
            'title' => 'required|string|max:255',
            'abstract' => 'nullable|string',
            'pdf_path' => 'nullable|file|mimes:pdf|max:10240', // 10MB max
            'page_start' => 'nullable|integer',
            'page_end' => 'nullable|integer',
            'doi' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:Published,Pending,Revision,Draft',
            'author_ids' => 'nullable|array',
            'author_ids.*' => 'exists:authors,id',
            'keyword_ids' => 'nullable|array',
            'keyword_ids.*' => 'exists:keywords,id',
        ]);

        if ($request->hasFile('pdf_path')) {
            $path = $request->file('pdf_path')->store('articles', 'r2');
            $validated['pdf_path'] = $path;
        }

        $article = Article::create($validated);

        if ($request->has('author_ids')) {
            $article->authors()->sync($request->author_ids);
        }

        if ($request->has('keyword_ids')) {
            $article->keywords()->sync($request->keyword_ids);
        }

        return new ArticleResource($article->load(['authors', 'keywords', 'issue.volume.journal']));
    }

    public function show(Article $article)
    {
        return new ArticleResource($article->load(['issue.volume.journal', 'authors', 'keywords']));
    }

    public function update(Request $request, Article $article)
    {
        $validated = $request->validate([
            'issue_id' => 'exists:issues,id',
            'title' => 'string|max:255',
            'abstract' => 'nullable|string',
            'pdf_path' => 'nullable|file|mimes:pdf|max:10240',
            'page_start' => 'nullable|integer',
            'page_end' => 'nullable|integer',
            'doi' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:Published,Pending,Revision,Draft',
            'author_ids' => 'nullable|array',
            'author_ids.*' => 'exists:authors,id',
            'keyword_ids' => 'nullable|array',
            'keyword_ids.*' => 'exists:keywords,id',
        ]);

        if ($request->hasFile('pdf_path')) {
            // Delete old file
            if ($article->pdf_path) {
                \Illuminate\Support\Facades\Storage::disk('r2')->delete($article->pdf_path);
            }
            $path = $request->file('pdf_path')->store('articles', 'r2');
            $validated['pdf_path'] = $path;
        }

        $article->update($validated);

        if ($request->has('author_ids')) {
            $article->authors()->sync($request->author_ids);
        }

        if ($request->has('keyword_ids')) {
            $article->keywords()->sync($request->keyword_ids);
        }

        return new ArticleResource($article->load(['authors', 'keywords', 'issue.volume.journal']));
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

        if (!$article->pdf_path) {
            return response()->json(['message' => 'PDF not found.'], 404);
        }

        return response()->json([
            'url' => url('storage/' . $article->pdf_path)
        ]);
    }
}
