<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Volume;
use App\Models\Journal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class TrashController extends Controller
{
    /**
     * Display a listing of soft-deleted items with days remaining.
     */
    public function index(Request $request)
    {
        $articles = Article::onlyTrashed()
            ->with(['volume.journal', 'authors'])
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(function ($item) {
                $days = 30 - (int) Carbon::now()->diffInDays(Carbon::parse($item->deleted_at));
                $item->days_remaining = max(0, $days);
                $item->type = 'article';
                return $item;
            });

        $volumes = Volume::onlyTrashed()
            ->with('journal')
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(function ($item) {
                $days = 30 - (int) Carbon::now()->diffInDays(Carbon::parse($item->deleted_at));
                $item->days_remaining = max(0, $days);
                $item->type = 'volume';
                $item->nested_articles_count = Article::withTrashed()->where('volume_id', $item->id)->count();
                return $item;
            });

        $journals = Journal::onlyTrashed()
            ->with('category')
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(function ($item) {
                $days = 30 - (int) Carbon::now()->diffInDays(Carbon::parse($item->deleted_at));
                $item->days_remaining = max(0, $days);
                $item->type = 'journal';
                $volIds = Volume::withTrashed()->where('journal_id', $item->id)->pluck('id');
                $item->nested_volumes_count = $volIds->count();
                $item->nested_articles_count = Article::withTrashed()->whereIn('volume_id', $volIds)->count();
                return $item;
            });

        return response()->json([
            'articles' => $articles,
            'volumes' => $volumes,
            'journals' => $journals,
            'total_count' => $articles->count() + $volumes->count() + $journals->count(),
        ]);
    }

    /**
     * Restore a soft-deleted item. Accessible by Admin & Super Admin.
     * Approach 1: Full cascade restore of entire journal tree (journal, all volumes, and all articles).
     */
    public function restore(Request $request, string $type, int $id)
    {
        $item = $this->findTrashedItem($type, $id);

        if (!$item) {
            return response()->json(['message' => 'Trashed item not found.'], 404);
        }

        $message = '';

        if ($type === 'journal') {
            $this->restoreJournalFullTree($item);
            $message = "Restored journal '{$item->title}' and all its volumes and articles";
        } elseif ($type === 'volume') {
            if ($item->journal_id && ($journal = Journal::withTrashed()->find($item->journal_id))) {
                $this->restoreJournalFullTree($journal);
                $message = "Restored Volume {$item->volume_number} and all associated contents of Journal '{$journal->title}'";
            } else {
                $item->restore();
                Article::onlyTrashed()->where('volume_id', $item->id)->restore();
                $message = "Restored Volume {$item->volume_number} and its articles";
            }
        } elseif ($type === 'article') {
            if ($item->volume_id && ($volume = Volume::withTrashed()->find($item->volume_id)) && $volume->journal_id && ($journal = Journal::withTrashed()->find($volume->journal_id))) {
                $this->restoreJournalFullTree($journal);
                $message = "Restored article '{$item->title}' and full tree of Journal '{$journal->title}'";
            } elseif ($item->volume_id && ($volume = Volume::withTrashed()->find($item->volume_id))) {
                $volume->restore();
                $item->restore();
                $message = "Restored article '{$item->title}' and Volume {$volume->volume_number}";
            } else {
                $item->restore();
                $message = "Restored article '{$item->title}'";
            }
        } else {
            $item->restore();
            $title = $item->title ?? "Item #{$id}";
            $message = "Restored {$type}: {$title}";
        }

        \App\Services\ActivityLogger::log('Restored Item', $message, get_class($item), $item->id);

        return response()->json(['message' => "{$message}.", 'item' => $item]);
    }

    /**
     * Helper to fully restore a journal, all its volumes, and all its articles.
     */
    protected function restoreJournalFullTree(Journal $journal)
    {
        if ($journal->trashed()) {
            $journal->restore();
        }

        // Restore all trashed volumes under this journal
        Volume::onlyTrashed()->where('journal_id', $journal->id)->restore();

        // Restore all trashed articles across all volumes of this journal
        $volumeIds = Volume::withTrashed()->where('journal_id', $journal->id)->pluck('id');
        if ($volumeIds->isNotEmpty()) {
            Article::onlyTrashed()->whereIn('volume_id', $volumeIds)->restore();
        }
    }

    /**
     * Force delete (permanently delete) a soft-deleted item and wipe its files from storage/R2.
     * Restricted to Super Admin.
     */
    public function forceDelete(Request $request, string $type, int $id)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('Super Admin')) {
            return response()->json(['message' => 'Unauthorized. Only Super Admins can permanently delete items.'], 403);
        }

        $item = $this->findTrashedItem($type, $id);

        if (!$item) {
            return response()->json(['message' => 'Trashed item not found.'], 404);
        }

        $title = $item->title ?? ($item->volume_number ? "Volume {$item->volume_number}" : "Item #{$id}");
        $disk = Storage::disk(config('filesystems.default'));

        // Delete physical files from R2/Storage before permanently purging
        if ($type === 'article' && !empty($item->pdf_path)) {
            try { $disk->delete($item->pdf_path); } catch (\Throwable $t) {}
        } elseif ($type === 'journal') {
            if (!empty($item->cover_image)) {
                try { $disk->delete($item->cover_image); } catch (\Throwable $t) {}
            }
            if (!empty($item->pdf_path)) {
                try { $disk->delete($item->pdf_path); } catch (\Throwable $t) {}
            }
        }

        $item->forceDelete();

        \App\Services\ActivityLogger::log('Permanently Purged Item', "Permanently purged {$type} and files from storage: {$title}", get_class($item), null);

        return response()->json(['message' => "{$type} permanently deleted and storage cleaned."]);
    }

    /**
     * Batch restore multiple soft-deleted items with full tree restoration.
     */
    public function batchRestore(Request $request)
    {
        $items = $request->input('items', []);
        $restoredCount = 0;

        foreach ($items as $target) {
            $type = $target['type'] ?? '';
            $id = (int) ($target['id'] ?? 0);
            $item = $this->findTrashedItem($type, $id);
            if ($item) {
                if ($type === 'journal') {
                    $this->restoreJournalFullTree($item);
                } elseif ($type === 'volume') {
                    if ($item->journal_id && ($journal = Journal::withTrashed()->find($item->journal_id))) {
                        $this->restoreJournalFullTree($journal);
                    } else {
                        $item->restore();
                        Article::onlyTrashed()->where('volume_id', $item->id)->restore();
                    }
                } elseif ($type === 'article') {
                    if ($item->volume_id && ($volume = Volume::withTrashed()->find($item->volume_id)) && $volume->journal_id && ($journal = Journal::withTrashed()->find($volume->journal_id))) {
                        $this->restoreJournalFullTree($journal);
                    } elseif ($item->volume_id && ($volume = Volume::withTrashed()->find($item->volume_id))) {
                        $volume->restore();
                        $item->restore();
                    } else {
                        $item->restore();
                    }
                } else {
                    $item->restore();
                }

                $title = $item->title ?? ($item->volume_number ? "Volume {$item->volume_number}" : "Item #{$id}");
                \App\Services\ActivityLogger::log('Restored Item', "Batch restored {$type}: {$title}", get_class($item), $item->id);
                $restoredCount++;
            }
        }

        return response()->json(['message' => "Successfully restored {$restoredCount} item(s).", 'count' => $restoredCount]);
    }

    /**
     * Batch force delete multiple soft-deleted items. Restricted to Super Admin.
     */
    public function batchForceDelete(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('Super Admin')) {
            return response()->json(['message' => 'Unauthorized. Only Super Admins can permanently delete items.'], 403);
        }

        $items = $request->input('items', []);
        $disk = Storage::disk(config('filesystems.default'));
        $purgedCount = 0;

        foreach ($items as $target) {
            $type = $target['type'] ?? '';
            $id = (int) ($target['id'] ?? 0);
            $item = $this->findTrashedItem($type, $id);
            if ($item) {
                if ($type === 'article' && !empty($item->pdf_path)) {
                    try { $disk->delete($item->pdf_path); } catch (\Throwable $t) {}
                } elseif ($type === 'journal') {
                    if (!empty($item->cover_image)) {
                        try { $disk->delete($item->cover_image); } catch (\Throwable $t) {}
                    }
                    if (!empty($item->pdf_path)) {
                        try { $disk->delete($item->pdf_path); } catch (\Throwable $t) {}
                    }
                }
                $item->forceDelete();
                $purgedCount++;
            }
        }

        \App\Services\ActivityLogger::log('Permanently Purged Items', "Batch purged {$purgedCount} item(s) from storage", 'Batch', null);

        return response()->json(['message' => "Successfully permanently deleted {$purgedCount} item(s).", 'count' => $purgedCount]);
    }

    /**
     * Purge all items in trash that have passed the 30-day limit.
     * Restricted to Super Admin.
     */
    public function purgeOld(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('Super Admin')) {
            return response()->json(['message' => 'Unauthorized. Only Super Admins can purge trash.'], 403);
        }

        $cutoff = Carbon::now()->subDays(30);
        $disk = Storage::disk(config('filesystems.default'));
        $purgedCount = 0;

        // Purge old articles
        Article::onlyTrashed()->where('deleted_at', '<=', $cutoff)->get()->each(function ($article) use ($disk, &$purgedCount) {
            if (!empty($article->pdf_path)) {
                try { $disk->delete($article->pdf_path); } catch (\Throwable $t) {}
            }
            $article->forceDelete();
            $purgedCount++;
        });

        // Purge old volumes
        Volume::onlyTrashed()->where('deleted_at', '<=', $cutoff)->get()->each(function ($volume) use (&$purgedCount) {
            $volume->forceDelete();
            $purgedCount++;
        });

        // Purge old journals
        Journal::onlyTrashed()->where('deleted_at', '<=', $cutoff)->get()->each(function ($journal) use ($disk, &$purgedCount) {
            if (!empty($journal->cover_image)) {
                try { $disk->delete($journal->cover_image); } catch (\Throwable $t) {}
            }
            if (!empty($journal->pdf_path)) {
                try { $disk->delete($journal->pdf_path); } catch (\Throwable $t) {}
            }
            $journal->forceDelete();
            $purgedCount++;
        });

        return response()->json(['message' => "Purged {$purgedCount} item(s) older than 30 days."]);
    }

    private function findTrashedItem(string $type, int $id)
    {
        return match ($type) {
            'article' => Article::onlyTrashed()->find($id),
            'volume' => Volume::onlyTrashed()->find($id),
            'journal' => Journal::onlyTrashed()->find($id),
            default => null,
        };
    }
}
