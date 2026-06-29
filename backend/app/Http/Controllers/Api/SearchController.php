<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Article;
use App\Models\Journal;
use App\Http\Resources\JournalResource;
use App\Http\Resources\ArticleResource;

class SearchController extends Controller
{
    /**
     * Search journals and articles.
     */
    public function index(Request $request)
    {
        $q = $request->query('q', '');

        if (empty(trim($q))) {
            return response()->json([
                'data' => [
                    'journals' => [],
                    'articles' => [],
                ]
            ]);
        }

        $term = '%' . strtolower($q) . '%';

        // Search Journals
        $journals = Journal::where('title', 'ilike', $term)
            ->orWhere('category', 'ilike', $term)
            ->orWhere('description', 'ilike', $term)
            ->limit(10)
            ->get();

        // Search Articles (including author names)
        $articles = Article::with(['issue.volume.journal', 'authors'])
            ->where('title', 'ilike', $term)
            ->orWhere('abstract', 'ilike', $term)
            ->orWhereHas('authors', function ($query) use ($term) {
                $query->where('name', 'ilike', $term);
            })
            ->limit(20)
            ->get();

        return response()->json([
            'data' => [
                'journals' => JournalResource::collection($journals),
                'articles' => ArticleResource::collection($articles),
            ]
        ]);
    }
}
