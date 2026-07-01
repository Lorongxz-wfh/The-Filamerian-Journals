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
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($request->hasFile('pdf_path')) {
            $path = $request->file('pdf_path')->store('articles', 'public');
            $validated['pdf_path'] = $path;
        }

        if ($request->hasFile('cover_image')) {
            $path = $request->file('cover_image')->store('articles/covers', 'public');
            $validated['cover_path'] = $path;
        }

        $article = Article::create($validated);

        $authorIds = $request->input('author_ids', []);

        if ($request->has('author_name')) {
            $authorName = $request->input('author_name') ?: 'The Filamerian Journals';
            $author = \App\Models\Author::firstOrCreate(['name' => $authorName]);
            $authorIds[] = $author->id;
        }

        if (count($authorIds) > 0) {
            $article->authors()->sync($authorIds);
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
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($request->hasFile('pdf_path')) {
            // Delete old file
            if ($article->pdf_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($article->pdf_path);
            }
            $path = $request->file('pdf_path')->store('articles', 'public');
            $validated['pdf_path'] = $path;
        }

        if ($request->hasFile('cover_image')) {
            if ($article->cover_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($article->cover_path);
            }
            $path = $request->file('cover_image')->store('articles/covers', 'public');
            $validated['cover_path'] = $path;
        }

        $article->update($validated);

        $authorIds = $request->input('author_ids', []);

        if ($request->has('author_name')) {
            $authorName = $request->input('author_name') ?: 'The Filamerian Journals';
            $author = \App\Models\Author::firstOrCreate(['name' => $authorName]);
            $authorIds[] = $author->id;
        }

        if (count($authorIds) > 0 || $request->has('author_name') || $request->has('author_ids')) {
            $article->authors()->sync($authorIds);
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

        // Delete Cover if exists
        if ($article->cover_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($article->cover_path);
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
            'url' => \Illuminate\Support\Facades\Storage::disk('public')->url($article->pdf_path)
        ]);
    }
}
