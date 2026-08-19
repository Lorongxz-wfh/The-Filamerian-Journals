<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserCreatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public string $tempPassword;
    public string $loginUrl;

    public function __construct(User $user, string $tempPassword)
    {
        $this->user = $user;
        $this->tempPassword = $tempPassword;
        $this->loginUrl = env('FRONTEND_URL', 'http://localhost:5173') . '/login';
    }

    public function build()
    {
        return $this->subject('Welcome to The FCU Journals - Account Created')
                    ->view('emails.user_created');
    }
}
