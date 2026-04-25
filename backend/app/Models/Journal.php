<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Journal extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'cover_image',
    ];

    public function volumes()
    {
        return $this->hasMany(Volume::class);
    }
}
