<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsApproved
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && !$request->user()->is_approved && $request->user()->email !== 'admin@filamerian.com' && !$request->user()->hasRole('Super Admin')) {
            return response()->json([
                'message' => 'Your account is currently pending administrator approval.'
            ], 403);
        }

        return $next($request);
    }
}
