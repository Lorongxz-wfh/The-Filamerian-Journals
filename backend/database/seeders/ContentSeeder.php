<?php

namespace Database\Seeders;

use App\Models\Journal;
use App\Models\Category;
use App\Models\Volume;
use App\Models\Article;
use App\Models\Author;
use App\Models\Keyword;
use App\Models\Announcement;
use App\Models\Feedback;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Undergraduate',
            'Graduate School',
            'Institutional',
            'Multidisciplinary'
        ];

        // Seed Categories
        $categoryModels = [];
        foreach ($categories as $cat) {
            $categoryModels[$cat] = Category::firstOrCreate(
                ['name' => $cat],
                ['slug' => Str::slug($cat)]
            );
        }

        $journalsData = [
            [
                'title' => 'Filamer Undergraduate Research Journal',
                'category' => 'Undergraduate',
                'description' => 'A premier publication showcasing outstanding research and academic projects by undergraduate students across various disciplines.',
                'issn' => '2718-9123',
                'frequency' => 'Biannual',
                'editor' => 'Dr. Maria Santos',
            ],
            [
                'title' => 'Filamer Arts & Sciences Student Journal',
                'category' => 'Undergraduate',
                'description' => 'Dedicated to publishing the best works in the humanities, social sciences, and natural sciences by degree-seeking students.',
                'issn' => '2718-9124',
                'frequency' => 'Annual',
                'editor' => 'Prof. Juan Dela Cruz',
            ],
            [
                'title' => 'Filamer Graduate School Review',
                'category' => 'Graduate School',
                'description' => 'A peer-reviewed journal publishing advanced research, theoretical perspectives, and methodological innovations from graduate scholars.',
                'issn' => '2718-9125',
                'frequency' => 'Biannual',
                'editor' => 'Dr. Teresa Magbanua',
            ],
            [
                'title' => 'Journal of Advanced Educational Research',
                'category' => 'Graduate School',
                'description' => 'Focusing on cutting-edge pedagogy, curriculum development, and educational administration research at the graduate level.',
                'issn' => '2718-9126',
                'frequency' => 'Quarterly',
                'editor' => 'Dr. Apolinario Mabini',
            ],
            [
                'title' => 'Filamer Institutional Studies',
                'category' => 'Institutional',
                'description' => 'An official publication focused on institutional assessment, academic development, and strategic initiatives within the university.',
                'issn' => '2718-9127',
                'frequency' => 'Annual',
                'editor' => 'Dr. Jose Rizal',
            ],
            [
                'title' => 'Filamer Multidisciplinary Journal',
                'category' => 'Multidisciplinary',
                'description' => 'A comprehensive journal covering a wide array of topics intersecting business, technology, health, and social sciences.',
                'issn' => '2718-9128',
                'frequency' => 'Biannual',
                'editor' => 'Dr. Andres Bonifacio',
            ]
        ];

        foreach ($journalsData as $index => $data) {
            $jIndex = $index + 1;
            
            // Journal
            $journal = Journal::updateOrCreate(
                ['slug' => Str::slug($data['title'])],
                [
                    'title' => $data['title'],
                    'description' => $data['description'],
                    'category_id' => $categoryModels[$data['category']]->id,
                    'publisher' => 'Filamer Christian University',
                    'issn' => $data['issn'],
                    'frequency' => $data['frequency'],
                    'editor' => $data['editor'],
                    'cover_image' => "journals/covers/placeholder_{$jIndex}.jpg",
                    'pdf_path' => "journals/pdfs/placeholder_{$jIndex}.pdf",
                ]
            );

            // Volumes (2-3 per journal)
            $numVolumes = rand(2, 3);
            for ($v = 1; $v <= $numVolumes; $v++) {
                $year = 2024 - ($numVolumes - $v); // e.g., 2022, 2023, 2024
                $volume = Volume::updateOrCreate(
                    ['journal_id' => $journal->id, 'volume_number' => "Vol. {$v}"],
                    ['year' => $year]
                );

                // Articles (2-3 per volume)
                $numArticles = rand(2, 3);
                for ($a = 1; $a <= $numArticles; $a++) {
                    $articleIndex = $a;
                    $pageStart = ($articleIndex * 15) - 14;
                    $pageEnd = ($articleIndex * 15);
                    $articleTitle = "Exploring the Dimensions of " . $data['category'] . " Studies: Case {$v}-{$a}";

                    $article = Article::updateOrCreate(
                        ['title' => $articleTitle, 'volume_id' => $volume->id],
                        [
                            'abstract' => "This comprehensive study explores critical aspects of {$data['category']} disciplines. Through meticulous methodology, it presents robust findings that enrich the ongoing discourse and provide practical implications for future research and practice.",
                            'status' => 'Published',
                            'page_start' => $pageStart,
                            'page_end' => $pageEnd,
                            'doi' => "10.1234/fcu.{$year}." . str_pad($jIndex, 2, '0', STR_PAD_LEFT) . "." . str_pad($v, 2, '0', STR_PAD_LEFT) . "." . str_pad($a, 2, '0', STR_PAD_LEFT),
                            'pdf_path' => "articles/pdfs/placeholder_v{$v}_a{$a}.pdf",
                            'views_count' => rand(50, 500),
                            'downloads_count' => rand(10, 200),
                            'order' => $a,
                        ]
                    );

                    // Authors
                    $firstNames = ['Juan', 'Maria', 'Pedro', 'Jose', 'Andres', 'Emilio', 'Gabriela'];
                    $lastNames = ['Dela Cruz', 'Santos', 'Penduko', 'Rizal', 'Bonifacio', 'Aguinaldo', 'Silang'];
                    
                    $numAuthors = rand(1, 3);
                    $authorIds = [];
                    for ($auth = 0; $auth < $numAuthors; $auth++) {
                        $fn = $firstNames[array_rand($firstNames)];
                        $ln = $lastNames[array_rand($lastNames)];
                        $fullName = "{$fn} {$ln}";
                        $author = Author::updateOrCreate(
                            ['email' => strtolower(str_replace(' ', '.', $fullName)) . rand(1, 99) . "@fcu.edu.ph"],
                            [
                                'name' => $fullName,
                                'first_name' => $fn,
                                'last_name' => $ln,
                            ]
                        );
                        $authorIds[] = $author->id;
                    }
                    $article->authors()->syncWithoutDetaching($authorIds);

                    // Keywords
                    $kws = ['Research', 'Innovation', 'Methodology', 'Analysis', 'Development', 'Education', 'Technology'];
                    shuffle($kws);
                    $selectedKws = array_slice($kws, 0, rand(2, 4));
                    
                    $keywordIds = [];
                    foreach ($selectedKws as $kw) {
                        $keyword = Keyword::firstOrCreate(['name' => $kw]);
                        $keywordIds[] = $keyword->id;
                    }
                    $article->keywords()->syncWithoutDetaching($keywordIds);
                }
            }

            // Announcement
            Announcement::firstOrCreate(
                ['title' => "Call for Papers: {$data['title']}"],
                [
                    'body' => "We are currently accepting new submissions for the upcoming issue of {$data['title']}. We invite scholars and researchers to submit their original work. The deadline for manuscript submission is fast approaching.",
                    'published_at' => now()->subDays(rand(2, 20))
                ]
            );

            // Feedback
            Feedback::firstOrCreate(
                ['email' => "inquiry{$jIndex}@fcu.edu.ph", 'subject' => "Submission Guidelines for {$data['title']}"],
                [
                    'name' => "Researcher {$jIndex}",
                    'message' => "Hello, I am interested in publishing my work in your journal. Could you please provide the detailed formatting guidelines and submission process?",
                    'category' => 'Inquiry',
                    'is_read' => false
                ]
            );
        }
    }
}
