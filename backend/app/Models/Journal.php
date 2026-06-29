<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Journal extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'category',
        'issn',
        'frequency',
        'editor',
        'cover_image',
    ];

    /**
     * Use slug for route model binding on public routes.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function volumes()
    {
        return $this->hasMany(Volume::class);
    }
}
