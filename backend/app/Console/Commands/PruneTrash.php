<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Article;
use App\Models\Volume;
use App\Models\Journal;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PruneTrash extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trash:prune';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete soft-deleted items older than 30 days and clean up storage/R2 files';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cutoff = Carbon::now()->subDays(30);
        $disk = Storage::disk(config('filesystems.default'));
        $count = 0;

        $this->info("Pruning soft-deleted items older than 30 days (before {$cutoff->toDateTimeString()})...");

        // Prune Articles
        Article::onlyTrashed()->where('deleted_at', '<=', $cutoff)->get()->each(function ($article) use ($disk, &$count) {
            if (!empty($article->pdf_path)) {
                try { $disk->delete($article->pdf_path); } catch (\Throwable $t) {}
            }
            $article->forceDelete();
            $count++;
        });

        // Prune Volumes
        Volume::onlyTrashed()->where('deleted_at', '<=', $cutoff)->get()->each(function ($volume) use (&$count) {
            $volume->forceDelete();
            $count++;
        });

        // Prune Journals
        Journal::onlyTrashed()->where('deleted_at', '<=', $cutoff)->get()->each(function ($journal) use ($disk, &$count) {
            if (!empty($journal->cover_image)) {
                try { $disk->delete($journal->cover_image); } catch (\Throwable $t) {}
            }
            if (!empty($journal->pdf_path)) {
                try { $disk->delete($journal->pdf_path); } catch (\Throwable $t) {}
            }
            $journal->forceDelete();
            $count++;
        });

        $this->info("Successfully pruned {$count} expired trash items and cleaned storage.");

        return Command::SUCCESS;
    }
}
