<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;
    
    protected $fillable = ['key', 'value'];

    public static function getMaxPdfUploadSizeKb(int $defaultMb = 10): int
    {
        $mb = static::where('key', 'max_pdf_upload_size')->value('value')
            ?: static::where('key', 'max_upload_size')->value('value');
        $val = is_numeric($mb) && (int)$mb > 0 ? (int)$mb : $defaultMb;
        return $val * 1024;
    }

    public static function getMaxImageUploadSizeKb(int $defaultMb = 5): int
    {
        $mb = static::where('key', 'max_image_upload_size')->value('value');
        $val = is_numeric($mb) && (int)$mb > 0 ? (int)$mb : $defaultMb;
        return $val * 1024;
    }
}
