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
        $fromYear = $request->query('from_year', '');
        $toYear = $request->query('to_year', '');

        if (!empty($year) && empty($fromYear) && empty($toYear)) {
            if (str_contains($year, '-')) {
                [$fromYear, $toYear] = explode('-', $year);
            } else {
                $fromYear = $year;
                $toYear = $year;
            }
        }

        if (empty(trim($q)) && empty($category) && empty($year) && empty($fromYear) && empty($toYear)) {
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
            $journalQuery = Journal::with('category');

            if (!empty(trim($q))) {
                $journalQuery->where(function ($query) use ($term) {
                    $query->where('title', 'ilike', $term)
                          ->orWhereHas('category', function ($q2) use ($term) {
                              $q2->where('name', 'ilike', $term);
                          })
                          ->orWhere('description', 'ilike', $term);
                });
            }

            if (!empty($categories)) {
                $journalQuery->whereHas('category', function ($query) use ($categories) {
                    $query->whereIn('name', $categories);
                });
            }

            if (!empty($fromYear) || !empty($toYear)) {
                $journalQuery->whereHas('volumes', function ($query) use ($fromYear, $toYear) {
                    if (!empty($fromYear)) {
                        $query->where('year', '>=', (int)$fromYear);
                    }
                    if (!empty($toYear)) {
                        $query->where('year', '<=', (int)$toYear);
                    }
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
            $articleQuery = Article::with(['volume.journal.category', 'authors'])->where('status', 'Published');

            if (!empty(trim($q))) {
                $articleQuery->where(function ($query) use ($term) {
                    $query->where('title', 'ilike', $term)
                          ->orWhere('abstract', 'ilike', $term)
                          ->orWhereHas('authors', function ($q2) use ($term) {
                              $q2->where('name', 'ilike', $term)
                                 ->orWhere('first_name', 'ilike', $term)
                                 ->orWhere('last_name', 'ilike', $term);
                          });
                });
            }

            if (!empty($categories)) {
                $articleQuery->whereHas('volume.journal.category', function ($query) use ($categories) {
                    $query->whereIn('name', $categories);
                });
            }

            if (!empty($fromYear) || !empty($toYear)) {
                $articleQuery->whereHas('volume', function ($query) use ($fromYear, $toYear) {
                    if (!empty($fromYear)) {
                        $query->where('year', '>=', (int)$fromYear);
                    }
                    if (!empty($toYear)) {
                        $query->where('year', '<=', (int)$toYear);
                    }
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
