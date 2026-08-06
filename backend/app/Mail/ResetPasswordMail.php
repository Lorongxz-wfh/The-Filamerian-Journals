<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public string $token;
    public string $resetUrl;

    public function __construct(User $user, string $token)
    {
        $this->user = $user;
        $this->token = $token;
        $this->resetUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);
    }

    public function build()
    {
        return $this->subject('Reset Your Password - The Filamerian Journals')
                    ->view('emails.reset_password');
    }
}
