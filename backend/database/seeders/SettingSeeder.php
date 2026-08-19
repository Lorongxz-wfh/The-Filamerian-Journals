<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Seed default application settings.
     */
    public function run(): void
    {
        $defaultSettings = [
            'site_title' => 'The FCU Journals',
            'site_tagline' => 'Official Research & Journal Publication Database of Filamer Christian University',
            'home_hero_title' => 'The FCU Journals',
            'home_hero_subtitle' => 'Explore peer-reviewed research, theses, capstone projects, and academic papers across multidisciplinary fields published by Filamer Christian University.',
            'home_about_us' => '<p class="text-sm text-muted leading-relaxed"><strong>The FCU Journals</strong> is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.</p>',
            'footer_journal_links_title' => 'The FCU Journals',
            'contact_email' => 'thefcujournals@gmail.com',
            'contact_phone' => '+63 9123456789',
            'contact_address' => 'Roxas Avenue, Roxas City, Capiz, Philippines 5800',
        ];

        foreach ($defaultSettings as $key => $value) {
            Setting::firstOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}
