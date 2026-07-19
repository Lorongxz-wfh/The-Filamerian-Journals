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
        $type = $request->query('type', 'all'); // 'all', 'journals', 'articles'
        $category = $request->query('category', '');
        $year = $request->query('year', '');

        if (empty(trim($q)) && empty($category) && empty($year)) {
            return response()->json([
                'data' => [
                    'journals' => [],
                    'articles' => [],
                ]
            ]);
        }

        $term = '%' . strtolower($q) . '%';
        $categories = !empty($category) ? array_map('trim', explode(',', $category)) : [];

        $journals = collect([]);
        $articles = collect([]);

        // Search Journals
        if ($type === 'all' || $type === 'journals') {
            $journalQuery = Journal::query();

            if (!empty(trim($q))) {
                $journalQuery->where(function ($query) use ($term) {
                    $query->where('title', 'ilike', $term)
                          ->orWhere('category', 'ilike', $term)
                          ->orWhere('description', 'ilike', $term);
                });
            }

            if (!empty($categories)) {
                $journalQuery->whereIn('category', $categories);
            }

            // Journals don't inherently have a "year" column in this basic setup (volumes have years), 
            // but we'll apply it if possible, or just ignore for journals.
            if (!empty($year)) {
                $journalQuery->whereHas('volumes', function ($query) use ($year) {
                    $query->where('year', $year);
                });
            }

            if ($type === 'all') {
                $journals = $journalQuery->limit(5)->get();
            } else {
                $journals = $journalQuery->paginate(15);
            }
        }

        // Search Articles
        if ($type === 'all' || $type === 'articles') {
            $articleQuery = Article::with(['volume.journal', 'authors']);

            if (!empty(trim($q))) {
                $articleQuery->where(function ($query) use ($term) {
                    $query->where('title', 'ilike', $term)
                          ->orWhere('abstract', 'ilike', $term)
                          ->orWhereHas('authors', function ($q2) use ($term) {
                              $q2->where('name', 'ilike', $term);
                          });
                });
            }

            if (!empty($categories)) {
                $articleQuery->whereHas('volume.journal', function ($query) use ($categories) {
                    $query->whereIn('category', $categories);
                });
            }

            if (!empty($year)) {
                $articleQuery->whereHas('volume', function ($query) use ($year) {
                    $query->where('year', $year);
                });
            }

            if ($type === 'all') {
                $articles = $articleQuery->limit(5)->get();
            } else {
                $articles = $articleQuery->paginate(15);
            }
        }

        // Format response
        $journalsResponse = [];
        if ($type === 'all' || $type === 'journals') {
            if ($type === 'all') {
                $journalsResponse = JournalResource::collection($journals);
            } else {
                $paginatedJournals = JournalResource::collection($journals)->response()->getData(true);
                $journalsResponse = $paginatedJournals;
            }
        }

        $articlesResponse = [];
        if ($type === 'all' || $type === 'articles') {
            if ($type === 'all') {
                $articlesResponse = ArticleResource::collection($articles);
            } else {
                $paginatedArticles = ArticleResource::collection($articles)->response()->getData(true);
                $articlesResponse = $paginatedArticles;
            }
        }

        return response()->json([
            'data' => [
                'journals' => $journalsResponse,
                'articles' => $articlesResponse,
            ]
        ]);
    }
}
