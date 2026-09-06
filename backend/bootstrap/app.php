<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        // Public invitation endpoints (RSVP, wishes) are read/written by
        // anonymous visitors with no CSRF cookie. Every admin/* endpoint
        // authenticates via a Sanctum bearer token (Authorization header),
        // not a cookie session — CSRF specifically targets cookie-based
        // auth (a forged cross-site request can ride along with cookies but
        // can't attach an Authorization header), so token auth is exempt by
        // its nature. Without this, a stale session cookie left over from
        // browser testing can trip a 419 on requests that never actually
        // relied on that cookie for auth.
        $middleware->validateCsrfTokens(except: [
            'api/invitations/*',
            'api/admin/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
