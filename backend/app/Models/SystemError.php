<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemError extends Model
{
    use HasFactory;

    protected $fillable = [
        'level',
        'message',
        'file',
        'line',
        'path',
        'method',
        'user_id',
        'stack_trace',
        'is_resolved',
    ];

    protected $casts = [
        'is_resolved' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
