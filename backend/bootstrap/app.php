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
        // Railway (and most PaaS hosts) terminate TLS at their edge and
        // forward plain HTTP to the container, setting X-Forwarded-Proto.
        // Without trusting that header, asset()/url() helpers can't tell
        // the original request was HTTPS and generate http:// URLs (e.g.
        // storage image links), which the browser then blocks as mixed
        // content on an https:// page. Trusting all proxies is safe here
        // because Railway's edge is the only thing that can reach this
        // container directly.
        $middleware->trustProxies(at: '*', headers: Request::HEADER_X_FORWARDED_FOR
            | Request::HEADER_X_FORWARDED_HOST
            | Request::HEADER_X_FORWARDED_PORT
            | Request::HEADER_X_FORWARDED_PROTO);

        // No statefulApi(): admin/client auth is purely a Sanctum bearer
        // token (Authorization header), never a cookie session — the
        // frontend (Vercel) and backend (Railway) live on unrelated domains.
        // The api/* group therefore carries no session or CSRF middleware at
        // all, which is correct for header-based auth (a forged cross-site
        // request can't attach an Authorization header) and for the
        // anonymous public RSVP/wish endpoints.
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
