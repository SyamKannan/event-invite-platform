<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Housekeeping — needs `php artisan schedule:run` on a cron (or
// `schedule:work`) in production to actually fire.
Schedule::command('sanctum:prune-expired --hours=24')->daily();
Schedule::command('app:prune-orphan-uploads')->weekly();
