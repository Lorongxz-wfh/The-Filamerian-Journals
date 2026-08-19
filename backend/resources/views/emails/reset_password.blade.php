<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password - The FCU Journals</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
        .header { background-color: #0b2545; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { font-family: Georgia, serif; font-size: 20px; letter-spacing: 1px; margin: 0; text-transform: uppercase; color: #f8fafc; }
        .content { padding: 32px 24px; line-height: 1.6; font-size: 14px; }
        .btn { display: inline-block; background-color: #0b2545; color: #ffffff !important; font-weight: bold; text-decoration: none; padding: 12px 24px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-radius: 2px; margin-top: 16px; }
        .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 11px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>The FCU Journals</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{{ $user->name }}</strong>,</p>
            <p>We received a request to reset the password for your account (<strong>{{ $user->email }}</strong>).</p>

            <p>Click the button below to set a new password for your account. This link will expire in <strong>60 minutes</strong>.</p>

            <div style="text-align: center; margin: 24px 0;">
                <a href="{{ $resetUrl }}" class="btn">Reset Password &rarr;</a>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 24px;">If you did not request a password reset, no further action is required. Your password will remain unchanged.</p>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Filamer Christian University — The FCU Journals. All rights reserved.
        </div>
    </div>
</body>
</html>
