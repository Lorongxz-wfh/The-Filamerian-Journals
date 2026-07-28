<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemError;
use Illuminate\Http\Request;

class SystemErrorController extends Controller
{
    /**
     * Display a listing of logged system errors.
     */
    public function index(Request $request)
    {
        $query = SystemError::with('user:id,name,email')->latest();

        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }

        if ($request->has('unresolved_only') && $request->unresolved_only == 'true') {
            $query->where('is_resolved', false);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * Log a client-side JavaScript error reported by frontend Error Boundary.
     */
    public function storeClientError(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'file' => 'nullable|string',
            'line' => 'nullable|integer',
            'path' => 'nullable|string',
            'stack_trace' => 'nullable|string',
        ]);

        $error = SystemError::create([
            'level' => 'client_error',
            'message' => $validated['message'],
            'file' => $validated['file'] ?? null,
            'line' => $validated['line'] ?? null,
            'path' => $validated['path'] ?? request()->header('Referer'),
            'method' => 'CLIENT',
            'user_id' => auth()->id(),
            'stack_trace' => $validated['stack_trace'] ?? null,
            'is_resolved' => false,
        ]);

        return response()->json(['data' => $error], 201);
    }

    /**
     * Toggle or mark an error as resolved.
     */
    public function resolve(SystemError $error)
    {
        $error->update(['is_resolved' => !$error->is_resolved]);
        return response()->json(['data' => $error]);
    }

    /**
     * Clear all resolved system errors.
     */
    public function clear()
    {
        SystemError::where('is_resolved', true)->delete();
        return response()->json(['message' => 'Resolved error logs cleared successfully']);
    }
}
