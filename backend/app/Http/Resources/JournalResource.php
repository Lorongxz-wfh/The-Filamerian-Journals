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
            'volumes_count' => (int) ($this->resource->volumes_count ?? $this->volumes()->count()),
            'articles_count' => (int) ($this->resource->articles_count ?? \App\Models\Article::whereHas('volume', fn($q) => $q->where('journal_id', $this->id))->count()),
            'volumes' => VolumeResource::collection($this->whenLoaded('volumes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

