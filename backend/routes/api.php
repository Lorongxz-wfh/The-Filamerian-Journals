<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Read-only for all authenticated users
    Route::apiResource('journals', \App\Http\Controllers\Api\JournalController::class)->only(['index', 'show']);
    Route::apiResource('volumes', \App\Http\Controllers\Api\VolumeController::class)->only(['index', 'show']);
    Route::apiResource('issues', \App\Http\Controllers\Api\IssueController::class)->only(['index', 'show']);
    Route::apiResource('articles', \App\Http\Controllers\Api\ArticleController::class)->only(['index', 'show']);
    Route::apiResource('authors', \App\Http\Controllers\Api\AuthorController::class)->only(['index', 'show']);
    Route::apiResource('keywords', \App\Http\Controllers\Api\KeywordController::class)->only(['index', 'show']);
    Route::apiResource('announcements', \App\Http\Controllers\Api\AnnouncementController::class)->only(['index', 'show']);

    // Write operations restricted to Super Admin and Editor
    Route::middleware('role:Super Admin|Editor')->group(function () {
        Route::apiResource('journals', \App\Http\Controllers\Api\JournalController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('volumes', \App\Http\Controllers\Api\VolumeController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('issues', \App\Http\Controllers\Api\IssueController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('articles', \App\Http\Controllers\Api\ArticleController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('authors', \App\Http\Controllers\Api\AuthorController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('keywords', \App\Http\Controllers\Api\KeywordController::class)->only(['store', 'update', 'destroy']);
        Route::apiResource('announcements', \App\Http\Controllers\Api\AnnouncementController::class)->only(['store', 'update', 'destroy']);
    });
});

// Public Routes — no auth required
Route::get('/public/journals', [\App\Http\Controllers\Api\JournalController::class, 'index']);
Route::get('/public/journals/{journal}', [\App\Http\Controllers\Api\JournalController::class, 'show']);
Route::get('/public/announcements', [\App\Http\Controllers\Api\AnnouncementController::class, 'index']);
