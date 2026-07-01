<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ResourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $resources = [
            [
                'title' => 'Submission Guidelines',
                'slug' => 'submission-guidelines',
                'content' => "<h3>Submission Guidelines</h3><p>We welcome original research articles, review papers, and short communications. Authors must ensure their submissions align with the aims and scope of the specific journal they are targeting.</p><h4>Manuscript Preparation</h4><ul><li>Manuscripts should be submitted in Microsoft Word (.docx) format.</li><li>Use Times New Roman, 12-point font, double-spaced with 1-inch margins on all sides.</li><li>Title page must include: Title, Author name(s), Affiliation(s), and corresponding author's email.</li><li>An abstract of 150–250 words is required, followed by 3–5 keywords.</li><li>All citations and references must adhere to the latest APA format.</li></ul>",
                'order' => 1
            ],
            [
                'title' => 'Editorial Board',
                'slug' => 'editorial-board',
                'content' => "<h3>Editorial Board</h3><p>Our editorial board consists of distinguished scholars and experts from various disciplines. They are responsible for overseeing the peer-review process and maintaining the academic integrity of the journals.</p>",
                'order' => 2
            ],
            [
                'title' => 'Ethics & Malpractice',
                'slug' => 'ethics-malpractice',
                'content' => "<h3>Ethics & Malpractice</h3><p>The Filamerian Journals are committed to upholding the highest standards of publication ethics. We take all possible measures against any publication malpractices.</p><ul><li>Authors must ensure their work is entirely original.</li><li>Plagiarism in all its forms constitutes unethical publishing behavior and is unacceptable.</li><li>Any form of data fabrication or manipulation will lead to immediate rejection or retraction.</li></ul>",
                'order' => 3
            ],
            [
                'title' => 'Indexing & Abstracting',
                'slug' => 'indexing-abstracting',
                'content' => "<h3>Indexing & Abstracting</h3><p>Our journals are currently indexed and abstracted in several major academic databases to ensure maximum visibility and reach for our authors' research.</p>",
                'order' => 4
            ]
        ];

        foreach ($resources as $resource) {
            \App\Models\Resource::updateOrCreate(
                ['slug' => $resource['slug']],
                $resource
            );
        }
    }
}
