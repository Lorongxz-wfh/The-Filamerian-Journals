<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasFactory;

    protected $fillable = [
        'issue_id',
        'title',
        'abstract',
        'pdf_path',
        'page_start',
        'page_end',
    ];

    public function issue()
    {
        return $this->belongsTo(Issue::class);
    }

    public function authors()
    {
        return $this->belongsToMany(Author::class);
    }

    public function keywords()
    {
        return $this->belongsToMany(Keyword::class);
    }
}
