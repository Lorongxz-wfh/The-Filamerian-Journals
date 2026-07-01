<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

use App\Models\User;

Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash) {
    $user = User::findOrFail($id);

    if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return response()->json(['message' => 'Invalid verification link.'], 403);
    }

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
        event(new \Illuminate\Auth\Events\Verified($user));
    }

    return redirect(env('FRONTEND_URL', 'http://localhost:5173') . '/login?verified=1');
})->middleware(['signed'])->name('verification.verify');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'index']);
    Route::get('/notifications/unread', [\App\Http\Controllers\Api\NotificationController::class, 'unread']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
    Route::delete('/notifications/{id}', [\App\Http\Controllers\Api\NotificationController::class, 'destroy']);

    // Dashboard stats
    Route::middleware([\App\Http\Middleware\EnsureUserIsApproved::class])->group(function () {
        Route::get('/dashboard/stats', [\App\Http\Controllers\Api\DashboardController::class, 'stats']);

    // Read-only for all authenticated users
    Route::apiResource('journals', \App\Http\Controllers\Api\JournalController::class)->only(['index', 'show']);
    Route::apiResource('volumes', \App\Http\Controllers\Api\VolumeController::class)->only(['index', 'show']);
    Route::apiResource('issues', \App\Http\Controllers\Api\IssueController::class)->only(['index', 'show']);
    Route::apiResource('articles', \App\Http\Controllers\Api\ArticleController::class)->only(['index', 'show']);
    Route::apiResource('authors', \App\Http\Controllers\Api\AuthorController::class)->only(['index', 'show']);
    Route::apiResource('keywords', \App\Http\Controllers\Api\KeywordController::class)->only(['index', 'show']);
    Route::apiResource('announcements', \App\Http\Controllers\Api\AnnouncementController::class)->only(['index', 'show']);
    Route::apiResource('resources', \App\Http\Controllers\Api\ResourceController::class)->only(['index', 'show']);

    Route::get('/articles/{article}/download-url', [\App\Http\Controllers\Api\ArticleController::class, 'getDownloadUrl']);

    // Reviews (Authenticated)
    // Write operations restricted to Super Admin and Admin
    Route::middleware('role:Super Admin|Admin')->group(function () {
        Route::apiResource('journals', \App\Http\Controllers\Api\JournalController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('volumes', \App\Http\Controllers\Api\VolumeController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('issues', \App\Http\Controllers\Api\IssueController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('articles', \App\Http\Controllers\Api\ArticleController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('authors', \App\Http\Controllers\Api\AuthorController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('keywords', \App\Http\Controllers\Api\KeywordController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('announcements', \App\Http\Controllers\Api\AnnouncementController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('resources', \App\Http\Controllers\Api\ResourceController::class)->only(['store', 'update', 'destroy']);
    });

    // Super Admin Only
    Route::middleware('role:Super Admin')->group(function () {
        // User management
        Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);
        Route::post('/users/{user}/approve', [\App\Http\Controllers\Api\UserController::class, 'approve']);
        // System Health
        Route::get('/system/health', [\App\Http\Controllers\Api\SystemController::class, 'health']);
    });
    }); // End EnsureUserIsApproved group
});

// Public Routes — no auth required
Route::get('/public/search', [\App\Http\Controllers\Api\SearchController::class, 'index']);
Route::get('/public/journals', [\App\Http\Controllers\Api\JournalController::class, 'index']);
Route::get('/public/journals/{journal}', [\App\Http\Controllers\Api\JournalController::class, 'show']);
Route::get('/public/announcements', [\App\Http\Controllers\Api\AnnouncementController::class, 'index']);
Route::get('/public/resources', [\App\Http\Controllers\Api\ResourceController::class, 'index']);
Route::get('/public/resources/{resource:slug}', [\App\Http\Controllers\Api\ResourceController::class, 'show']);

// Settings & Feedbacks
Route::get('/public/settings', [\App\Http\Controllers\Api\SettingController::class, 'index']);
Route::post('/public/feedbacks', [\App\Http\Controllers\Api\FeedbackController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::middleware([\App\Http\Middleware\EnsureUserIsApproved::class])->group(function () {
        Route::post('/settings', [\App\Http\Controllers\Api\SettingController::class, 'store'])->middleware('role:Super Admin');
        Route::get('/feedbacks', [\App\Http\Controllers\Api\FeedbackController::class, 'index'])->middleware('role:Super Admin|Admin');
        Route::put('/feedbacks/{feedback}', [\App\Http\Controllers\Api\FeedbackController::class, 'update'])->middleware('role:Super Admin|Admin');
        Route::delete('/feedbacks/{feedback}', [\App\Http\Controllers\Api\FeedbackController::class, 'destroy'])->middleware('role:Super Admin');
    });
});
