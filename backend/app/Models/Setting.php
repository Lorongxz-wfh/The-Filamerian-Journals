<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;
    
    protected $fillable = ['key', 'value'];

    public static function getMaxUploadSizeKb(int $defaultMb = 10): int
    {
        $mb = static::where('key', 'max_upload_size')->value('value');
        $val = is_numeric($mb) && (int)$mb > 0 ? (int)$mb : $defaultMb;
        return $val * 1024;
    }
}
