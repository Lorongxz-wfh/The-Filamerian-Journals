<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Journal;
use App\Models\Article;
use App\Models\Author;
use App\Models\Announcement;
use App\Models\User;

class DashboardController extends Controller
{
    /**
     * Return aggregate stats for the dashboard overview.
     */
    public function stats()
    {
        return response()->json([
            'journals' => Journal::count(),
            'articles' => Article::count(),
            'authors' => Author::count(),
            'users' => User::count(),
            'announcements' => Announcement::count(),
        ]);
    }
}
