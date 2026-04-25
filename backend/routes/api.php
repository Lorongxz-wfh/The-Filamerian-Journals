<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Protected Admin Routes (Will add role middleware later)
    Route::apiResource('journals', \App\Http\Controllers\Api\JournalController::class);
    Route::apiResource('volumes', \App\Http\Controllers\Api\VolumeController::class);
    Route::apiResource('issues', \App\Http\Controllers\Api\IssueController::class);
    Route::apiResource('articles', \App\Http\Controllers\Api\ArticleController::class);
    Route::apiResource('authors', \App\Http\Controllers\Api\AuthorController::class);
    Route::apiResource('keywords', \App\Http\Controllers\Api\KeywordController::class);
    Route::apiResource('announcements', \App\Http\Controllers\Api\AnnouncementController::class);
});

// Public Routes (Optional - can refine later)
Route::get('/public/journals', [\App\Http\Controllers\Api\JournalController::class, 'index']);
Route::get('/public/announcements', [\App\Http\Controllers\Api\AnnouncementController::class, 'index']);
