<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Author extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'email',
    ];

    protected $appends = ['formatted_name'];

    public function getFormattedNameAttribute()
    {
        if ($this->last_name) {
            $formatted = $this->last_name . ', ' . $this->first_name;
            if ($this->middle_name) {
                $middleInitial = mb_substr(trim($this->middle_name), 0, 1) . '.';
                $formatted .= ' ' . $middleInitial;
            }
            if ($this->suffix) {
                $formatted .= ' ' . $this->suffix;
            }
            return $formatted;
        }
        return $this->attributes['name'] ?? null;
    }

    public function getNameAttribute($value)
    {
        // Return the formatted name if structured data exists, otherwise fallback to the old name
        return $this->getFormattedNameAttribute();
    }

    public function articles()
    {
        return $this->belongsToMany(Article::class);
    }
}
