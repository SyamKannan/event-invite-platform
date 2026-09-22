<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * login: brute-force protection, per username+IP and per IP overall.
     * guest-submissions: anonymous RSVP/wish POSTs, so one script can't
     * flood an invitation with fake responses.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('login', fn (Request $request): array => [
            Limit::perMinute(5)->by(strtolower((string) $request->input('username')).'|'.$request->ip()),
            Limit::perMinute(20)->by($request->ip()),
        ]);

        RateLimiter::for('guest-submissions', fn (Request $request): array => [
            Limit::perMinute(6)->by($request->ip().'|'.$request->route('slug')),
            Limit::perHour(60)->by($request->ip()),
        ]);
    }
}
