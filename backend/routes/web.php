<?php

use App\Http\Controllers\Public\ShareController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Crawler-friendly OG/Twitter-card preview page for "Share to WhatsApp" links
// — see ShareController's docblock for why the SPA route can't do this alone.
Route::get('/share/{slug}', [ShareController::class, 'show'])->name('share.show');
