<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JournalResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'cover_image' => $this->cover_image ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->cover_image) : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
