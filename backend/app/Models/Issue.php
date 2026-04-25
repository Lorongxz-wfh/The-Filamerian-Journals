<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Issue extends Model
{
    use HasFactory;

    protected $fillable = [
        'volume_id',
        'issue_number',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function volume()
    {
        return $this->belongsTo(Volume::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }
}
