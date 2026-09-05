<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\GalleryImageController;
use App\Http\Controllers\Admin\InvitationController as AdminInvitationController;
use App\Http\Controllers\Admin\MilestoneController;
use App\Http\Controllers\Admin\PersonController;
use App\Http\Controllers\Admin\RsvpController as AdminRsvpController;
use App\Http\Controllers\Admin\ScheduleEventController;
use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\Admin\WishController as AdminWishController;
use App\Http\Controllers\Public\InvitationController as PublicInvitationController;
use App\Http\Controllers\Public\RsvpController as PublicRsvpController;
use App\Http\Controllers\Public\WishController as PublicWishController;
use Illuminate\Support\Facades\Route;

// ---- Public routes (no auth) — consumed by the invitation page itself. ----
Route::get('invitations/{slug}', [PublicInvitationController::class, 'show']);
Route::post('invitations/{slug}/rsvp', [PublicRsvpController::class, 'store']);
Route::get('invitations/{slug}/wishes', [PublicWishController::class, 'index']);
Route::post('invitations/{slug}/wishes', [PublicWishController::class, 'store']);

// ---- Admin auth ----
Route::post('admin/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->prefix('admin')->group(function (): void {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);

    Route::apiResource('invitations', AdminInvitationController::class)->except(['update'])->parameters([
        'invitations' => 'invitation',
    ]);
    Route::put('invitations/{invitation}', [AdminInvitationController::class, 'update']);

    Route::prefix('invitations/{invitation}')->group(function (): void {
        Route::post('people', [PersonController::class, 'store']);
        Route::put('people/{person}', [PersonController::class, 'update']);
        Route::delete('people/{person}', [PersonController::class, 'destroy']);

        Route::post('schedule-events', [ScheduleEventController::class, 'store']);
        Route::put('schedule-events/{scheduleEvent}', [ScheduleEventController::class, 'update']);
        Route::delete('schedule-events/{scheduleEvent}', [ScheduleEventController::class, 'destroy']);

        Route::post('milestones', [MilestoneController::class, 'store']);
        Route::put('milestones/{milestone}', [MilestoneController::class, 'update']);
        Route::delete('milestones/{milestone}', [MilestoneController::class, 'destroy']);

        Route::post('gallery-images', [GalleryImageController::class, 'store']);
        Route::put('gallery-images/{galleryImage}', [GalleryImageController::class, 'update']);
        Route::delete('gallery-images/{galleryImage}', [GalleryImageController::class, 'destroy']);

        Route::post('upload', [UploadController::class, 'store']);

        Route::get('rsvps', [AdminRsvpController::class, 'index']);
        Route::get('rsvps/export', [AdminRsvpController::class, 'export']);

        Route::get('wishes', [AdminWishController::class, 'index']);
        Route::delete('wishes/{wish}', [AdminWishController::class, 'destroy']);
    });
});
