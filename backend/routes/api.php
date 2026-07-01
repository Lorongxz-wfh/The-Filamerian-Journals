<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

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

    Route::get('/articles/{article}/download-url', [\App\Http\Controllers\Api\ArticleController::class, 'getDownloadUrl']);

    // Submissions & Reviews (Authenticated)
    Route::apiResource('submissions', \App\Http\Controllers\Api\SubmissionController::class)->only(['index', 'store', 'show', 'update']);
    Route::post('/submissions/{submission}/assign-reviewer', [\App\Http\Controllers\Api\SubmissionController::class, 'assignReviewer'])->middleware('role:Super Admin|Editor');
    Route::apiResource('reviews', \App\Http\Controllers\Api\ReviewController::class)->only(['index', 'show', 'update']);

    // Write operations restricted to Super Admin and Editor
    Route::middleware('role:Super Admin|Editor')->group(function () {
        Route::apiResource('journals', \App\Http\Controllers\Api\JournalController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('volumes', \App\Http\Controllers\Api\VolumeController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('issues', \App\Http\Controllers\Api\IssueController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('articles', \App\Http\Controllers\Api\ArticleController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('authors', \App\Http\Controllers\Api\AuthorController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('keywords', \App\Http\Controllers\Api\KeywordController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('announcements', \App\Http\Controllers\Api\AnnouncementController::class)->only(['store', 'update', 'destroy']);

        // User management (Super Admin only)
        Route::apiResource('users', \App\Http\Controllers\Api\UserController::class);
        Route::post('/users/{user}/approve', [\App\Http\Controllers\Api\UserController::class, 'approve']);
    });
    }); // End EnsureUserIsApproved group
});

// Public Routes — no auth required
Route::get('/public/search', [\App\Http\Controllers\Api\SearchController::class, 'index']);
Route::get('/public/journals', [\App\Http\Controllers\Api\JournalController::class, 'index']);
Route::get('/public/journals/{journal}', [\App\Http\Controllers\Api\JournalController::class, 'show']);
Route::get('/public/announcements', [\App\Http\Controllers\Api\AnnouncementController::class, 'index']);

// Settings & Feedbacks
Route::get('/public/settings', [\App\Http\Controllers\Api\SettingController::class, 'index']);
Route::post('/public/feedbacks', [\App\Http\Controllers\Api\FeedbackController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::middleware([\App\Http\Middleware\EnsureUserIsApproved::class])->group(function () {
        Route::post('/settings', [\App\Http\Controllers\Api\SettingController::class, 'store'])->middleware('role:Super Admin');
        Route::get('/feedbacks', [\App\Http\Controllers\Api\FeedbackController::class, 'index'])->middleware('role:Super Admin|Editor');
        Route::put('/feedbacks/{feedback}', [\App\Http\Controllers\Api\FeedbackController::class, 'update'])->middleware('role:Super Admin|Editor');
        Route::delete('/feedbacks/{feedback}', [\App\Http\Controllers\Api\FeedbackController::class, 'destroy'])->middleware('role:Super Admin');
    });
});
