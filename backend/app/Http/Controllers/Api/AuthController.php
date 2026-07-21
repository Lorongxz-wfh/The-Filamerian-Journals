<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Events\Registered;
use Illuminate\Validation\Rules\Password;
use App\Services\ActivityLogger;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_approved' => false,
        ]);

        $user->assignRole('Author');

        event(new Registered($user));

        return response()->json([
            'message' => 'Registration successful. Please check your email to verify your account.',
        ], 201);
    }
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            if ($user) {
                ActivityLogger::log('Failed Login Attempt', "Failed login attempt for {$request->email}", User::class, $user->id, $user->id);
            }
            
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'email' => ['Please verify your email address before logging in. Check your inbox.'],
            ]);
        }
        
        if (! $user->is_approved) {
            throw ValidationException::withMessages([
                'email' => ['Your account is pending administrator approval.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLogger::log('Logged In', "User logged in", User::class, $user->id, $user->id);

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->load('roles'),
        ]);
    }

    public function logout(Request $request)
    {
        ActivityLogger::log('Logged Out', "User logged out", User::class, $request->user()->id, $request->user()->id);
        
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load('roles'));
    }
}
