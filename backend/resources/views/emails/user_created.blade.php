<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to The FCU Journals</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 30px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
        .header { background-color: #0b2545; padding: 24px; text-align: center; color: #ffffff; }
        .header h1 { font-family: Georgia, serif; font-size: 20px; letter-spacing: 1px; margin: 0; text-transform: uppercase; color: #f8fafc; }
        .content { padding: 32px 24px; line-height: 1.6; font-size: 14px; }
        .cred-box { background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px 20px; margin: 20px 0; border-radius: 4px; }
        .cred-item { margin-bottom: 8px; font-size: 13px; }
        .cred-item strong { color: #0b2545; }
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
            <p>An administrator has created an account for you on <strong>The FCU Research & Journal Management Portal</strong>.</p>
            
            <div class="cred-box">
                <div class="cred-item"><strong>Login Email:</strong> {{ $user->email }}</div>
                <div class="cred-item"><strong>Temporary Password:</strong> <span style="font-family: monospace; font-weight: bold; color: #d97706; font-size: 15px;">{{ $tempPassword }}</span></div>
                <div class="cred-item"><strong>Assigned Role:</strong> {{ $user->roles->pluck('name')->implode(', ') ?: 'Staff' }}</div>
            </div>

            <p style="font-size: 13px; color: #475569;">For safety reasons, please log in and change your temporary password immediately in your account settings.</p>

            <div style="text-align: center;">
                <a href="{{ $loginUrl }}" class="btn">Access Dashboard Login &rarr;</a>
            </div>
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} Filamer Christian University — The FCU Journals. All rights reserved.
        </div>
    </div>
</body>
</html>
