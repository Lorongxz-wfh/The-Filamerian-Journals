<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Http\Resources\AnnouncementResource;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    public function index()
    {
        return AnnouncementResource::collection(Announcement::orderBy('published_at', 'desc')->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'published_at' => 'nullable|date',
        ]);

        $announcement = Announcement::create($validated);

        // Notify all users about the new announcement
        $users = \App\Models\User::where('is_approved', true)->get();
        \Illuminate\Support\Facades\Notification::send($users, new \App\Notifications\SystemNotification(
            'New Announcement',
            $announcement->title,
            'info',
            '/dashboard/announcements'
        ));

        return new AnnouncementResource($announcement);
    }

    public function show(Announcement $announcement)
    {
        return new AnnouncementResource($announcement);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $validated = $request->validate([
            'title' => 'string|max:255',
            'body' => 'string',
            'published_at' => 'nullable|date',
        ]);

        $announcement->update($validated);

        return new AnnouncementResource($announcement);
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();

        return response()->noContent();
    }
}
