<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Article extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'volume_id',
        'title',
        'abstract',
        'pdf_path',
        'page_start',
        'page_end',
        'doi',
        'status',
        'order',
    ];

    public function volume()
    {
        return $this->belongsTo(Volume::class);
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
