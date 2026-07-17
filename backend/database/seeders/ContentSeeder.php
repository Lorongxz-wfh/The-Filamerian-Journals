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
        $categories = ['Science', 'Education', 'Arts'];
        
        for ($i = 1; $i <= 3; $i++) {
            // Journal
            $journalTitle = "Filamer Journal of {$categories[$i - 1]}";
            $journal = Journal::firstOrCreate(
                ['slug' => Str::slug($journalTitle)],
                [
                    'title' => $journalTitle,
                    'description' => "An official open-access publication for the field of {$categories[$i - 1]}.",
                    'category' => $categories[$i - 1],
                    'publisher' => 'Filamer Christian University'
                ]
            );

            // Volume
            $volume = Volume::firstOrCreate(
                ['journal_id' => $journal->id, 'volume_number' => "Vol. 1 Issue {$i}"],
                ['year' => 2026]
            );

            // Article
            $articleTitle = "Advanced Research Methodology in {$categories[$i - 1]}";
            $article = Article::firstOrCreate(
                ['title' => $articleTitle, 'volume_id' => $volume->id],
                [
                    'abstract' => "This abstract summarizes the critical findings and methodologies applied in the field of {$categories[$i - 1]}. It highlights empirical data and offers insightful conclusions for future studies.",
                    'status' => 'published',
                    'page_start' => 1,
                    'page_end' => 12 + $i,
                ]
            );

            // Author
            $author = Author::firstOrCreate(
                ['email' => "author{$i}@fcu.edu.ph"],
                ['name' => "Dr. Author {$i}"]
            );
            $article->authors()->syncWithoutDetaching([$author->id]);

            // Keyword
            $keyword = Keyword::firstOrCreate(
                ['name' => "Research {$i}"]
            );
            $article->keywords()->syncWithoutDetaching([$keyword->id]);

            // Announcement
            Announcement::firstOrCreate(
                ['title' => "Call for Papers: {$categories[$i - 1]} Journal"],
                [
                    'body' => "We are currently accepting new submissions for the upcoming issue of the Filamer Journal of {$categories[$i - 1]}. Deadline is at the end of the month.",
                    'published_at' => now()->subDays($i * 2)
                ]
            );

            // Feedback
            Feedback::firstOrCreate(
                ['email' => "student{$i}@fcu.edu.ph", 'subject' => "Submission Guidelines Question"],
                [
                    'name' => "Student {$i}",
                    'message' => "Hello, I would like to clarify some formatting rules for my thesis submission. Thank you.",
                    'category' => 'Inquiry',
                    'is_read' => false
                ]
            );
        }
    }
}
