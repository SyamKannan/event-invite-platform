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
        // anonymous visitors with no CSRF cookie. Admin login is a stateless
        // credential exchange that returns a Sanctum bearer token (not
        // cookie-session auth), so it carries no CSRF cookie either — both
        // are exempt from the stateful CSRF check.
        $middleware->validateCsrfTokens(except: [
            'api/invitations/*',
            'api/admin/login',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
