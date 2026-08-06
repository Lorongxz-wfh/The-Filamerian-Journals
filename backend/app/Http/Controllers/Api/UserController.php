<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Illuminate\Validation\Rules\Password;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\UserCreatedMail;

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
            'role' => 'required|string|max:100',
        ]);

        $tempPassword = Str::random(8) . '!1a';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($tempPassword),
            'is_approved' => true,
            'email_verified_at' => now(),
        ]);

        $roleObj = \Spatie\Permission\Models\Role::firstOrCreate(['name' => $validated['role']]);
        $user->assignRole($roleObj);

        // Send email with credentials
        try {
            Mail::to($user->email)->send(new UserCreatedMail($user, $tempPassword));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send welcome email to {$user->email}: " . $e->getMessage());
        }

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
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|string|max:100',
        ]);

        // If changing role away from Super Admin, ensure at least one active Super Admin remains
        if (!empty($validated['role']) && $validated['role'] !== 'Super Admin' && $user->hasRole('Super Admin')) {
            $activeSuperAdmins = User::role('Super Admin')->where('is_disabled', false)->where('id', '!=', $user->id)->count();
            if ($activeSuperAdmins === 0) {
                return response()->json(['message' => 'Action forbidden. At least one active Super Admin is required.'], 422);
            }
        }

        if (!empty($validated['name'])) $user->name = $validated['name'];
        if (!empty($validated['email'])) $user->email = $validated['email'];
        if (!empty($validated['password'])) $user->password = Hash::make($validated['password']);
        $user->save();

        if (!empty($validated['role'])) {
            $roleObj = \Spatie\Permission\Models\Role::firstOrCreate(['name' => $validated['role']]);
            $user->syncRoles([$roleObj]);
        }

        \App\Services\ActivityLogger::log('Updated User', "Updated user account for {$user->name}", get_class($user), $user->id);

        return response()->json($user->load('roles'));
    }

    public function toggleStatus(User $user)
    {
        // Cannot disable yourself
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot disable your own account.'], 422);
        }

        // If disabling a Super Admin, ensure at least one active Super Admin remains
        if (!$user->is_disabled && $user->hasRole('Super Admin')) {
            $activeSuperAdmins = User::role('Super Admin')->where('is_disabled', false)->where('id', '!=', $user->id)->count();
            if ($activeSuperAdmins === 0) {
                return response()->json(['message' => 'Cannot disable the last active Super Admin account.'], 422);
            }
        }

        $newDisabledState = !$user->is_disabled;
        $user->update([
            'is_disabled' => $newDisabledState,
            'disabled_at' => $newDisabledState ? now() : null,
        ]);

        $actionText = $newDisabledState ? 'Disabled' : 'Enabled';
        \App\Services\ActivityLogger::log("{$actionText} User", "{$actionText} user account for {$user->name}", get_class($user), $user->id);

        return response()->json([
            'message' => "User account {$actionText} successfully.",
            'user' => $user->load('roles')
        ]);
    }

    public function destroy(User $user)
    {
        // 1. Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        // 2. User must be disabled first
        if (!$user->is_disabled || !$user->disabled_at) {
            return response()->json(['message' => 'User must be disabled before permanently deleting.'], 422);
        }

        // 3. Enforce 24-hour waiting period after disabling
        $hoursSinceDisabled = now()->diffInHours($user->disabled_at);
        if ($hoursSinceDisabled < 24) {
            $hoursLeft = 24 - $hoursSinceDisabled;
            return response()->json([
                'message' => "Account safety period active. Please wait {$hoursLeft} more hour(s) before permanently deleting this account."
            ], 422);
        }

        // 4. Prevent deleting if last Super Admin
        if ($user->hasRole('Super Admin')) {
            $superAdminCount = User::role('Super Admin')->count();
            if ($superAdminCount <= 1) {
                return response()->json(['message' => 'Cannot delete the only Super Admin account.'], 422);
            }
        }

        $name = $user->name;
        $class = get_class($user);

        // Revoke tokens and soft delete
        $user->tokens()->delete();
        $user->delete();

        \App\Services\ActivityLogger::log('Deleted User', "Soft-deleted user account for {$name}", $class, null);

        return response()->noContent();
    }

    public function approve(User $user)
    {
        $user->update(['is_approved' => true]);

        \App\Services\ActivityLogger::log('Approved User', "Approved user account for {$user->name}", get_class($user), $user->id);

        return response()->json(['message' => 'User approved successfully.']);
    }
}
