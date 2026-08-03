<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

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
    Route::apiResource('categories', \App\Http\Controllers\Api\CategoryController::class)->only(['index', 'show']);
    Route::apiResource('volumes', \App\Http\Controllers\Api\VolumeController::class)->only(['index', 'show']);
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
        Route::apiResource('categories', \App\Http\Controllers\Api\CategoryController::class)->only(['store', 'update', 'destroy']);
        Route::post('categories/reorder', [\App\Http\Controllers\Api\CategoryController::class, 'reorder']);
        Route::post('volumes/{volume}/reorder', [\App\Http\Controllers\Api\VolumeController::class, 'reorderArticles']);
        Route::apiResource('volumes', \App\Http\Controllers\Api\VolumeController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('articles', \App\Http\Controllers\Api\ArticleController::class)->only(['store', 'update', 'destroy']);
        Route::post('imports/articles', [\App\Http\Controllers\Api\ImportController::class, 'importArticles']);
        Route::post('imports/journals', [\App\Http\Controllers\Api\ImportController::class, 'importJournals']);
        Route::apiResource('authors', \App\Http\Controllers\Api\AuthorController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('keywords', \App\Http\Controllers\Api\KeywordController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('announcements', \App\Http\Controllers\Api\AnnouncementController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('resources', \App\Http\Controllers\Api\ResourceController::class)->only(['store', 'update', 'destroy']);

        // Trash Bin (Read & Restore for Admin & Super Admin)
        Route::get('trash', [\App\Http\Controllers\Api\TrashController::class, 'index']);
        Route::post('trash/batch-restore', [\App\Http\Controllers\Api\TrashController::class, 'batchRestore']);
        Route::post('trash/{type}/{id}/restore', [\App\Http\Controllers\Api\TrashController::class, 'restore']);
        
        // Super Admin trash routes
        Route::middleware(['role:Super Admin'])->group(function () {
            Route::delete('trash/batch-force', [\App\Http\Controllers\Api\TrashController::class, 'batchForceDelete']);
            Route::delete('trash/{type}/{id}/force', [\App\Http\Controllers\Api\TrashController::class, 'forceDelete']);
            Route::delete('trash/purge', [\App\Http\Controllers\Api\TrashController::class, 'purgeOld']);
        }); // User management
        Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);
        Route::post('/users/{user}/approve', [\App\Http\Controllers\Api\UserController::class, 'approve']);
        Route::post('/users/{user}/toggle-status', [\App\Http\Controllers\Api\UserController::class, 'toggleStatus']);
        // System Health, Errors & Logs
        Route::get('/system/health', [\App\Http\Controllers\Api\SystemController::class, 'health']);
        Route::delete('/system/logs', [\App\Http\Controllers\Api\SystemController::class, 'clearLogs']);
        Route::get('/system/errors', [\App\Http\Controllers\Api\SystemErrorController::class, 'index']);
        Route::put('/system/errors/{error}/resolve', [\App\Http\Controllers\Api\SystemErrorController::class, 'resolve']);
        Route::delete('/system/errors/clear', [\App\Http\Controllers\Api\SystemErrorController::class, 'clear']);
        Route::get('/dashboard/logs', [\App\Http\Controllers\Api\DashboardController::class, 'logs']);
    });
    }); // End EnsureUserIsApproved group
});

// Client Error Logging Endpoint (Public / Auth)
Route::post('/public/client-error', [\App\Http\Controllers\Api\SystemErrorController::class, 'storeClientError']);

// Public Routes — no auth required
Route::get('/public/search', [\App\Http\Controllers\Api\SearchController::class, 'index']);
Route::get('/public/journals', [\App\Http\Controllers\Api\JournalController::class, 'index']);
Route::get('/public/journals/{journal}', [\App\Http\Controllers\Api\JournalController::class, 'show']);
Route::get('/public/journals/{journal}/pdf', [\App\Http\Controllers\Api\JournalController::class, 'servePdf']);
Route::get('/public/journals/{journal}/cover', [\App\Http\Controllers\Api\JournalController::class, 'serveCover']);
Route::get('/public/announcements', [\App\Http\Controllers\Api\AnnouncementController::class, 'index']);
Route::get('/public/resources', [\App\Http\Controllers\Api\ResourceController::class, 'index']);
Route::get('/public/resources/{resource:slug}', [\App\Http\Controllers\Api\ResourceController::class, 'show']);
Route::get('/public/articles/latest', [\App\Http\Controllers\Api\ArticleController::class, 'getLatest']);
Route::get('/public/articles/{article}', [\App\Http\Controllers\Api\ArticleController::class, 'showPublic']);
Route::get('/public/articles/{article}/download-url', [\App\Http\Controllers\Api\ArticleController::class, 'getDownloadUrl']);
Route::get('/public/articles/{article}/pdf', [\App\Http\Controllers\Api\ArticleController::class, 'servePdf']);
Route::post('/public/articles/{article}/view', [\App\Http\Controllers\Api\ArticleController::class, 'trackView']);
Route::get('/public/articles/{article}/related', [\App\Http\Controllers\Api\ArticleController::class, 'getRelated']);
Route::get('/public/categories', [\App\Http\Controllers\Api\CategoryController::class, 'index']);

// Settings & Feedbacks
Route::get('/public/settings', [\App\Http\Controllers\Api\SettingController::class, 'index']);
Route::post('/public/feedbacks', [\App\Http\Controllers\Api\FeedbackController::class, 'store'])->middleware('throttle:1,3');

Route::middleware('auth:sanctum')->group(function () {
    Route::middleware([\App\Http\Middleware\EnsureUserIsApproved::class])->group(function () {
        Route::post('/settings', [\App\Http\Controllers\Api\SettingController::class, 'store'])->middleware('role:Super Admin');
        Route::get('/feedbacks/unread-count', [\App\Http\Controllers\Api\FeedbackController::class, 'unreadCount'])->middleware('role:Super Admin|Admin');
        Route::get('/feedbacks', [\App\Http\Controllers\Api\FeedbackController::class, 'index'])->middleware('role:Super Admin|Admin');
        Route::put('/feedbacks/{feedback}', [\App\Http\Controllers\Api\FeedbackController::class, 'update'])->middleware('role:Super Admin|Admin');
        Route::delete('/feedbacks/{feedback}', [\App\Http\Controllers\Api\FeedbackController::class, 'destroy'])->middleware('role:Super Admin');
    });
});
