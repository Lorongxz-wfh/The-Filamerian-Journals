<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('roles')->orderBy('name');
        
        if ($request->filled('search')) {
            $search = strtolower($request->query('search'));
            $query->where(function($q) use ($search) {
                $q->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(email) LIKE ?', ["%{$search}%"]);
            });
        }

        if ($request->has('pending_only')) {
            $query->where('is_approved', false);
        }

        return response()->json($query->paginate(50));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'string', Password::min(8)->mixedCase()->numbers()->symbols()],
            'role' => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_approved' => true,
            'email_verified_at' => now(),
        ]);

        $user->assignRole($validated['role']);

        \App\Services\ActivityLogger::log('Created User', "Created user account for {$user->name}", get_class($user), $user->id);

        return response()->json($user->load('roles'), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('roles'));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'email' => 'email|unique:users,email,' . $user->id,
            'password' => ['nullable', 'string', Password::min(8)->mixedCase()->numbers()->symbols()],
            'role' => 'nullable|string|exists:roles,name',
        ]);

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'email' => $validated['email'] ?? $user->email,
            'password' => !empty($validated['password']) ? Hash::make($validated['password']) : $user->password,
        ]);

        if (!empty($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        \App\Services\ActivityLogger::log('Updated User', "Updated user account for {$user->name}", get_class($user), $user->id);

        return response()->json($user->load('roles'));
    }

    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete your own account.'], 403);
        }

        $name = $user->name;
        $class = get_class($user);

        $user->delete();

        \App\Services\ActivityLogger::log('Deleted User', "Deleted user account for {$name}", $class, null);

        return response()->noContent();
    }

    public function approve(User $user)
    {
        $user->update(['is_approved' => true]);

        \App\Services\ActivityLogger::log('Approved User', "Approved user account for {$user->name}", get_class($user), $user->id);

        return response()->json(['message' => 'User approved successfully.']);
    }
}
