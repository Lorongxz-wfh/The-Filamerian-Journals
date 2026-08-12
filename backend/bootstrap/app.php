<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->append(\Illuminate\Http\Middleware\HandleCors::class);

        $middleware->validateCsrfTokens(except: [
            'api/*',
            'login',
            'logout',
            'register',
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->reportable(function (\Throwable $e) {
            try {
                // Ignore standard ValidationExceptions and AuthenticationExceptions from cluttering error logs
                if ($e instanceof \Illuminate\Validation\ValidationException || $e instanceof \Illuminate\Auth\AuthenticationException) {
                    return;
                }

                \App\Models\SystemError::create([
                    'level' => 'error',
                    'message' => $e->getMessage() ?: get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'path' => request()->fullUrl(),
                    'method' => request()->method(),
                    'user_id' => auth()->id(),
                    'stack_trace' => $e->getTraceAsString(),
                    'is_resolved' => false,
                ]);
            } catch (\Throwable $loggingError) {
                // Prevent error logger itself from throwing an exception
            }
        });
    })->create();
