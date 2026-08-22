<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ArticleResource extends JsonResource
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
            'volume_id' => $this->volume_id,
            'title' => $this->title,
            'abstract' => $this->abstract,
            'pdf_url' => $this->pdf_path ? (url('/api/public/articles/' . $this->id . '/pdf') . ($this->updated_at ? '?v=' . strtotime((string)$this->updated_at) : '')) : null,
            'page_start' => $this->page_start,
            'page_end' => $this->page_end,
            'doi' => $this->doi,
            'status' => $this->status,
            'order' => $this->order,
            'volume' => new VolumeResource($this->whenLoaded('volume')),
            'authors' => AuthorResource::collection($this->whenLoaded('authors')),
            'keywords' => KeywordResource::collection($this->whenLoaded('keywords')),
            'views_count' => $this->views_count,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
