<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'order'];

    public function journals()
    {
        return $this->hasMany(Journal::class);
    }
}
