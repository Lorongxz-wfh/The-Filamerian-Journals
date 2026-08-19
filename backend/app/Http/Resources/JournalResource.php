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
            'slug' => $this->slug,
            'description' => $this->description,
            'category_id' => $this->category_id,
            'status' => $this->status ?? 'Published',
            'category' => $this->whenLoaded('category', function () {
                return $this->category ? [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'slug' => $this->category->slug,
                ] : null;
            }, function() {
                return $this->category ? [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'slug' => $this->category->slug,
                ] : null;
            }),
            'publisher' => $this->publisher,
            'issn' => $this->issn,
            'frequency' => $this->frequency,
            'editor' => $this->editor,
            'cover_image' => $this->cover_image ? url('/api/public/journals/' . ($this->slug ?: $this->id) . '/cover') : null,
            'pdf_url' => $this->pdf_path ? url('/api/public/journals/' . ($this->slug ?: $this->id) . '/pdf') : null,
            'volumes_count' => (int) ($this->volumes_count ?? ($this->relationLoaded('volumes') ? $this->volumes->count() : 0)),
            'articles_count' => (int) ($this->articles_count ?? ($this->relationLoaded('articles') ? $this->articles->count() : 0)),
            'volumes' => VolumeResource::collection($this->whenLoaded('volumes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

