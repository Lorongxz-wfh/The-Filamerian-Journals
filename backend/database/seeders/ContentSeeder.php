<?php

namespace Database\Seeders;

use App\Models\Journal;
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
        $journalsData = [
            [
                'title' => 'Filamer Journal of Education and Pedagogy',
                'category' => 'Education',
                'description' => 'A peer-reviewed open-access journal dedicated to publishing high-quality research in education, pedagogical innovations, and curriculum development.',
                'article' => 'The Impact of Blended Learning on Student Engagement in Post-Pandemic Education',
                'authors' => ['Maria Clara Santos', 'Jose Rizal', 'Apolinario Mabini'],
                'keywords' => ['Blended Learning', 'Student Engagement', 'Pedagogy'],
            ],
            [
                'title' => 'Filamer Journal of Nursing and Health Sciences',
                'category' => 'Nursing',
                'description' => 'An official publication focused on evidence-based practice, clinical nursing research, and public health innovations.',
                'article' => 'Evaluating the Efficacy of Telehealth Nursing in Rural Communities',
                'authors' => ['Juan Dela Cruz', 'Teresa Magbanua'],
                'keywords' => ['Telehealth', 'Rural Health', 'Nursing Practice'],
            ],
            [
                'title' => 'Filamerian Business and Economics Review',
                'category' => 'Business',
                'description' => 'A multidisciplinary journal covering applied economics, strategic management, accounting, and organizational behavior.',
                'article' => 'Strategic Resiliency of Micro-Enterprises During Economic Uncertainty',
                'authors' => ['Pedro Penduko'],
                'keywords' => ['Micro-Enterprises', 'Economic Resiliency', 'Strategic Management'],
            ],
            [
                'title' => 'Filamer Journal of Computer Studies and Technology',
                'category' => 'Information Technology',
                'description' => 'Publishing cutting-edge research on software engineering, artificial intelligence, data science, and information systems.',
                'article' => 'Machine Learning Approaches for Predictive Analytics in Educational Data',
                'authors' => ['Emilio Aguinaldo', 'Andres Bonifacio'],
                'keywords' => ['Machine Learning', 'Predictive Analytics', 'Educational Data Mining'],
            ]
        ];

        foreach ($journalsData as $index => $data) {
            $i = $index + 1;
            
            // Journal
            $journal = Journal::firstOrCreate(
                ['slug' => Str::slug($data['title'])],
                [
                    'title' => $data['title'],
                    'description' => $data['description'],
                    'category' => $data['category'],
                    'publisher' => 'Filamer Christian University'
                ]
            );

            // Volume
            $volume = Volume::firstOrCreate(
                ['journal_id' => $journal->id, 'volume_number' => "Vol. 1 Issue " . $i],
                ['year' => 2024]
            );

            // Article
            $article = Article::firstOrCreate(
                ['title' => $data['article'], 'volume_id' => $volume->id],
                [
                    'abstract' => "This paper explores the critical aspects of {$data['article']} within the context of {$data['category']}. Through quantitative and qualitative analysis, the study presents significant findings that contribute to the ongoing discourse in the field.",
                    'status' => 'published',
                    'page_start' => ($i * 10) + 1,
                    'page_end' => ($i * 10) + 15,
                    'doi' => "10.1234/fcu.2024.00{$i}"
                ]
            );

            // Authors (No Honorifics)
            foreach ($data['authors'] as $authorName) {
                $author = Author::firstOrCreate(
                    ['email' => strtolower(str_replace(' ', '.', $authorName)) . "@fcu.edu.ph"],
                    ['name' => $authorName]
                );
                $article->authors()->syncWithoutDetaching([$author->id]);
            }

            // Keywords
            foreach ($data['keywords'] as $kw) {
                $keyword = Keyword::firstOrCreate(['name' => $kw]);
                $article->keywords()->syncWithoutDetaching([$keyword->id]);
            }

            // Announcement
            Announcement::firstOrCreate(
                ['title' => "Call for Papers: {$data['title']}"],
                [
                    'body' => "We are currently accepting new submissions for the upcoming issue of the {$data['title']}. We invite scholars and researchers to submit their original work. Deadline is at the end of the month.",
                    'published_at' => now()->subDays($i * 2)
                ]
            );

            // Feedback
            Feedback::firstOrCreate(
                ['email' => "student{$i}@fcu.edu.ph", 'subject' => "Submission Guidelines Question for {$data['category']}"],
                [
                    'name' => "Student {$i}",
                    'message' => "Hello, I would like to clarify some formatting rules for my thesis submission to your journal. Thank you.",
                    'category' => 'Inquiry',
                    'is_read' => false
                ]
            );
        }
    }
}
