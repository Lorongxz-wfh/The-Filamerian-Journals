<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Article;
use App\Models\Author;
use App\Models\Category;
use App\Models\Keyword;
use App\Models\Journal;
use App\Models\Volume;

class ImportController extends Controller
{
    /**
     * Import a bulk list of articles from a JSON payload parsed by the frontend.
     */
    public function importArticles(Request $request)
    {
        $validated = $request->validate([
            'journal_id' => 'required|exists:journals,id',
            'volume_id' => 'required|exists:volumes,id',
            'articles' => 'required|array',
            'articles.*.title' => 'required|string',
            'articles.*.abstract' => 'nullable|string',
            'articles.*.authors' => 'nullable|string',
            'articles.*.category' => 'nullable|string',
            'articles.*.keywords' => 'nullable|string',
            'articles.*.page_start' => 'nullable|string',
            'articles.*.page_end' => 'nullable|string',
            'articles.*.doi' => 'nullable|string',
            'articles.*.status' => 'nullable|in:Published,Draft',
        ]);

        $volumeId = $validated['volume_id'];
        $articles = $validated['articles'];
        $importedCount = 0;
        
        // Use a database transaction to ensure all or nothing
        DB::beginTransaction();

        try {
            // Pre-fetch the max order for this volume to append new articles to the end
            $maxOrder = Article::where('volume_id', $volumeId)->max('order') ?? 0;

            foreach ($articles as $index => $row) {
                // 1. Handle Category (Global, optional)
                $categoryId = null;
                if (!empty($row['category'])) {
                    $categoryName = trim($row['category']);
                    $category = Category::firstOrCreate(
                        ['name' => $categoryName],
                        ['slug' => \Illuminate\Support\Str::slug($categoryName), 'description' => '']
                    );
                    $categoryId = $category->id;
                }

                // 2. Create Article
                $maxOrder++;
                $article = Article::create([
                    'volume_id' => $volumeId,
                    'title' => trim($row['title']),
                    'abstract' => isset($row['abstract']) ? trim($row['abstract']) : null,
                    'page_start' => isset($row['page_start']) ? trim($row['page_start']) : null,
                    'page_end' => isset($row['page_end']) ? trim($row['page_end']) : null,
                    'doi' => isset($row['doi']) ? trim($row['doi']) : null,
                    'status' => (isset($row['status']) && !empty(trim($row['status']))) ? trim($row['status']) : 'Draft',
                    'order' => $maxOrder,
                ]);

                // 3. Handle Authors with Smart Parsing & Case-Insensitive Deduplication
                if (!empty($row['authors'])) {
                    $rawAuthors = $row['authors'];
                    // Split authors by semicolon, " and ", or comma (if semicolon/and not used)
                    if (strpos($rawAuthors, ';') !== false) {
                        $authorStrings = array_filter(array_map('trim', explode(';', $rawAuthors)));
                    } else if (preg_match('/\s+and\s+/i', $rawAuthors)) {
                        $authorStrings = array_filter(array_map('trim', preg_split('/\s+and\s+/i', $rawAuthors)));
                    } else {
                        $authorStrings = array_filter(array_map('trim', explode(',', $rawAuthors)));
                    }
                    
                    $authorIds = [];
                    foreach ($authorStrings as $authorStr) {
                        if (empty($authorStr)) continue;
                        
                        $parsed = $this->parseAuthorName($authorStr);
                        $cleanFullName = strtolower(trim($parsed['full_name']));
                        $cleanFirst = strtolower(trim($parsed['first_name']));
                        $cleanLast = strtolower(trim($parsed['last_name']));
                        
                        // Smart Case-Insensitive Deduplication Search
                        $author = null;
                        if (!empty($cleanFirst) && !empty($cleanLast)) {
                            $author = Author::whereRaw('LOWER(first_name) = ? AND LOWER(last_name) = ?', [$cleanFirst, $cleanLast])->first();
                        }

                        if (!$author && !empty($cleanFullName)) {
                            $author = Author::whereRaw('LOWER(name) = ?', [$cleanFullName])->first();
                        }

                        if (!$author && !empty($cleanLast)) {
                            $author = Author::whereRaw('LOWER(last_name) = ?', [$cleanLast])->first();
                        }

                        if (!$author) {
                            $author = Author::create([
                                'name' => $parsed['full_name'],
                                'first_name' => $parsed['first_name'],
                                'middle_name' => $parsed['middle_name'],
                                'last_name' => $parsed['last_name'],
                                'suffix' => $parsed['suffix'],
                                'email' => null,
                            ]);
                        }
                        
                        $authorIds[] = $author->id;
                    }
                    if (!empty($authorIds)) {
                        $article->authors()->sync(array_unique($authorIds));
                    }
                }

                // 4. Handle Keywords
                if (!empty($row['keywords'])) {
                    $keywordNames = array_map('trim', explode(',', $row['keywords']));
                    $keywordIds = [];
                    foreach ($keywordNames as $name) {
                        if (empty($name)) continue;
                        $keyword = Keyword::firstOrCreate(
                            ['name' => strtolower($name)]
                        );
                        $keywordIds[] = $keyword->id;
                    }
                    if (!empty($keywordIds)) {
                        $article->keywords()->sync($keywordIds);
                    }
                }
                
                $importedCount++;
            }

            DB::commit();

            return response()->json([
                'message' => "Successfully imported {$importedCount} articles.",
                'count' => $importedCount
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to import articles: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Smartly parse a full author name into first_name, middle_name, last_name, suffix.
     * Supports formats:
     * - "Doe, John Maria Jr." (Last, First Middle Suffix)
     * - "John Maria De La Cruz Jr." (First Middle Last Suffix)
     */
    private function parseAuthorName(string $name): array
    {
        $name = trim($name);
        $suffixes = ['jr', 'jr.', 'sr', 'sr.', 'iii', 'iv', 'v', 'phd', 'ph.d.', 'md'];
        
        $firstName = '';
        $middleName = '';
        $lastName = '';
        $suffix = '';

        // Check if name uses "Lastname, Firstname Middlename Suffix" format
        if (strpos($name, ',') !== false) {
            $parts = array_map('trim', explode(',', $name, 2));
            $lastName = $parts[0];
            
            $remainingTokens = array_values(array_filter(explode(' ', $parts[1])));
            
            // Check for suffix at the end of remaining
            if (count($remainingTokens) > 1 && in_array(strtolower(end($remainingTokens)), $suffixes)) {
                $suffix = array_pop($remainingTokens);
            }
            
            if (!empty($remainingTokens)) {
                $firstName = array_shift($remainingTokens);
                $middleName = implode(' ', $remainingTokens);
            }
        } else {
            // "First Middle Last Suffix" format
            $tokens = array_values(array_filter(explode(' ', $name)));
            
            // Check for suffix
            if (count($tokens) > 1 && in_array(strtolower(end($tokens)), $suffixes)) {
                $suffix = array_pop($tokens);
            }

            if (count($tokens) === 1) {
                $lastName = $tokens[0];
            } elseif (count($tokens) === 2) {
                $firstName = $tokens[0];
                $lastName = $tokens[1];
            } else {
                $firstName = array_shift($tokens);
                $lastName = array_pop($tokens);
                $middleName = implode(' ', $tokens);
            }
        }

        // Re-build standard clean name string
        $fullName = $name;

        return [
            'full_name' => $fullName,
            'first_name' => $firstName ?: null,
            'middle_name' => $middleName ?: null,
            'last_name' => $lastName ?: null,
            'suffix' => $suffix ?: null,
        ];
    }

    /**
     * Import a bulk list of journals from a JSON payload parsed by the frontend.
     */
    public function importJournals(Request $request)
    {
        $validated = $request->validate([
            'journals' => 'required|array',
            'journals.*.title' => 'required|string',
            'journals.*.description' => 'nullable|string',
            'journals.*.category' => 'nullable|string',
            'journals.*.issn' => 'nullable|string',
            'journals.*.frequency' => 'nullable|string',
            'journals.*.editor' => 'nullable|string',
            'journals.*.publisher' => 'nullable|string',
            'journals.*.volume_number' => 'nullable|string',
            'journals.*.volume_year' => 'nullable|numeric',
        ]);

        $journalsData = $validated['journals'];
        $importedCount = 0;
        DB::beginTransaction();

        try {
            foreach ($journalsData as $row) {
                // Category
                $categoryId = null;
                if (!empty($row['category'])) {
                    $categoryName = trim($row['category']);
                    $category = Category::firstOrCreate(
                        ['name' => $categoryName],
                        ['slug' => \Illuminate\Support\Str::slug($categoryName), 'description' => '']
                    );
                    $categoryId = $category->id;
                }

                // Journal
                $title = trim($row['title']);
                $baseSlug = \Illuminate\Support\Str::slug($title);
                $slug = $baseSlug;
                $counter = 1;
                while (Journal::where('slug', $slug)->where('title', '!=', $title)->exists()) {
                    $slug = $baseSlug . '-' . $counter++;
                }

                $journal = Journal::firstOrCreate(
                    ['title' => $title],
                    [
                        'slug' => $slug,
                        'description' => isset($row['description']) ? trim($row['description']) : null,
                        'category_id' => $categoryId,
                        'issn' => isset($row['issn']) ? trim($row['issn']) : null,
                        'frequency' => isset($row['frequency']) ? trim($row['frequency']) : null,
                        'editor' => isset($row['editor']) ? trim($row['editor']) : null,
                        'publisher' => isset($row['publisher']) ? trim($row['publisher']) : null,
                    ]
                );

                // Initial Volume creation if volume_number provided
                if (!empty($row['volume_number'])) {
                    Volume::firstOrCreate([
                        'journal_id' => $journal->id,
                        'volume_number' => trim($row['volume_number']),
                        'year' => isset($row['volume_year']) ? intval($row['volume_year']) : date('Y'),
                    ]);
                }

                $importedCount++;
            }

            DB::commit();

            \App\Services\ActivityLogger::log('Bulk Imported Journals', "Bulk imported {$importedCount} journals", Journal::class, null);

            return response()->json([
                'message' => "Successfully imported {$importedCount} journals.",
                'count' => $importedCount
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to import journals: ' . $e->getMessage()
            ], 500);
        }
    }
}
