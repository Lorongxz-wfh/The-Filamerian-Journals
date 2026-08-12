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

        try {
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
            
            if ($user->is_disabled) {
                throw ValidationException::withMessages([
                    'email' => ['Your account has been disabled by an administrator. Please contact support.'],
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
        } catch (ValidationException $ve) {
            throw $ve;
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Login Exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            return response()->json([
                'message' => 'Login server error: ' . $e->getMessage()
            ], 500);
        }
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

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->save();

        ActivityLogger::log('Updated Profile', "User updated profile information", User::class, $user->id, $user->id);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->load('roles'),
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided current password does not match our records.'],
            ]);
        }

        $user->password = Hash::make($validated['new_password']);
        $user->save();

        ActivityLogger::log('Changed Password', "User changed account password", User::class, $user->id, $user->id);

        return response()->json([
            'message' => 'Password changed successfully.',
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'If your email is registered, you will receive a reset link shortly.'], 200);
        }

        $token = \Illuminate\Support\Str::random(64);

        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'email' => $user->email,
                'token' => Hash::make($token),
                'created_at' => now()
            ]
        );

        defer(function () use ($user, $token) {
            try {
                \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\ResetPasswordMail($user, $token));
            } catch (\Throwable $e) {
                $msg = $e->getMessage();
                \Illuminate\Support\Facades\Log::error("Failed to send password reset email to {$user->email}: " . $msg);
                ActivityLogger::log('Email Dispatch Failed', "Failed sending password reset email to {$user->email}: {$msg}", User::class, $user->id);
            }
        });

        ActivityLogger::log('Requested Password Reset', "Requested password reset for {$user->email}", User::class, $user->id, $user->id);

        return response()->json([
            'message' => 'A password reset link has been sent to your email address.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $resetRecord = \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord || !Hash::check($request->token, $resetRecord->token)) {
            throw ValidationException::withMessages([
                'token' => ['This password reset token is invalid or has expired.'],
            ]);
        }

        // Check token expiration (60 minutes)
        if (\Carbon\Carbon::parse($resetRecord->created_at)->addMinutes(60)->isPast()) {
            \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            throw ValidationException::withMessages([
                'token' => ['This password reset link has expired. Please request a new one.'],
            ]);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $user->password = Hash::make($request->password);
        $user->save();

        // Delete reset token
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        ActivityLogger::log('Reset Password', "Successfully reset password for {$user->email}", User::class, $user->id, $user->id);

        return response()->json([
            'message' => 'Your password has been reset successfully. You can now log in with your new password.',
        ]);
    }
}
