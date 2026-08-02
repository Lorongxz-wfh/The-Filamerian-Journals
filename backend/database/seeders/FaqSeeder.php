<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            // General
            [
                'question' => 'What is The Filamerian Journals platform?',
                'answer' => 'The Filamerian Journals is the official academic publishing and journal repository platform for Filamer Christian University. It hosts peer-reviewed undergraduate, graduate, institutional, and multidisciplinary research journals with free open-access reading and PDF downloading.',
                'category' => 'General',
                'audience' => 'public',
                'sort_order' => 1,
                'is_published' => true,
            ],
            [
                'question' => 'Are articles on this platform open access?',
                'answer' => 'Yes! All published journals and research articles are freely accessible to the public for reading and downloading. No paid subscription or registration is required to read abstracts or download PDF documents.',
                'category' => 'General',
                'audience' => 'public',
                'sort_order' => 2,
                'is_published' => true,
            ],
            
            // Readers & Researchers
            [
                'question' => 'How can I search for specific research articles?',
                'answer' => 'Use the global search bar at the top of the website or press Shift + / to open keyboard shortcuts. You can search by article title, author name, category, or relevant keywords.',
                'category' => 'Readers',
                'audience' => 'public',
                'sort_order' => 3,
                'is_published' => true,
            ],
            [
                'question' => 'How do I cite an article from Filamerian Journals?',
                'answer' => 'On any article preview or detail page, click the "Cite" button. You can automatically copy citations formatted in APA 7th, MLA 9th, Chicago, or Harvard reference styles.',
                'category' => 'Readers',
                'audience' => 'public',
                'sort_order' => 4,
                'is_published' => true,
            ],
            [
                'question' => 'Can I download PDF copies of research papers?',
                'answer' => 'Yes. Every published article includes an in-browser PDF viewer with full-screen reading modes and an instant "Download PDF" button.',
                'category' => 'Readers',
                'audience' => 'public',
                'sort_order' => 5,
                'is_published' => true,
            ],

            // Authors & Submissions
            [
                'question' => 'Who can submit research papers to Filamerian Journals?',
                'answer' => 'Filamer Christian University faculty, graduate students, undergraduate researchers, and invited external academic contributors are eligible to submit manuscripts for editorial review.',
                'category' => 'Authors',
                'audience' => 'all',
                'sort_order' => 6,
                'is_published' => true,
            ],
            [
                'question' => 'What file formats are accepted for article PDF uploads?',
                'answer' => 'Full-text manuscripts must be uploaded as PDF files. Cover graphics and supplementary images accept JPG, PNG, and WebP formats.',
                'category' => 'Authors',
                'audience' => 'all',
                'sort_order' => 7,
                'is_published' => true,
            ],
            [
                'question' => 'What is the maximum PDF file upload size limit?',
                'answer' => 'The default PDF upload limit is configured under System Settings (typically up to 25 MB per document). Large graphic files are automatically optimized.',
                'category' => 'Authors',
                'audience' => 'all',
                'sort_order' => 8,
                'is_published' => true,
            ],

            // Publishing & Editors
            [
                'question' => 'How does the Journal > Volume > Issue > Article hierarchy work?',
                'answer' => 'The platform follows standard academic structure: Each Journal contains numbered Volumes (typically one volume per publication year). Volumes contain Issues (e.g., Issue No. 1 - Vol 12), and Articles are assigned to specific Issues and Volumes.',
                'category' => 'Publishing',
                'audience' => 'admin',
                'sort_order' => 9,
                'is_published' => true,
            ],
            [
                'question' => 'How do I add a new article or author in the Dashboard?',
                'answer' => 'Logged-in staff can navigate to Dashboard > Articles or Dashboard > Authors and press "N" on their keyboard to instantly open the Creation Form modal.',
                'category' => 'Publishing',
                'audience' => 'admin',
                'sort_order' => 10,
                'is_published' => true,
            ],

            // Administration & Security
            [
                'question' => 'What keyboard shortcuts are available in the Dashboard?',
                'answer' => 'Press Shift + / (or Shift + ?) anywhere in the dashboard to toggle the Keyboard Shortcuts guide. Shortcuts include N (Create New Item), Esc (Close Modal), and Tab navigation.',
                'category' => 'Admin',
                'audience' => 'admin',
                'sort_order' => 11,
                'is_published' => true,
            ],
            [
                'question' => 'How does Role-Based Access Control (RBAC) work?',
                'answer' => 'Super Admins have full access to User Management, Activity Logs, and System Health. Admins can create and edit Journals, Volumes, and Articles. Non-admin users are restricted from administrative controls.',
                'category' => 'Admin',
                'audience' => 'admin',
                'sort_order' => 12,
                'is_published' => true,
            ],
            [
                'question' => 'What happens when Maintenance Mode is toggled on?',
                'answer' => 'When Maintenance Mode is active in System Settings, public visitors are shown a scheduled maintenance notice while logged-in Admins retain uninterrupted access to manage the system.',
                'category' => 'Admin',
                'audience' => 'admin',
                'sort_order' => 13,
                'is_published' => true,
            ],
        ];

        foreach ($faqs as $faq) {
            Faq::updateOrCreate(
                ['question' => $faq['question']],
                $faq
            );
        }
    }
}
