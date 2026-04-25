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
            'issue_id' => $this->issue_id,
            'title' => $this->title,
            'abstract' => $this->abstract,
            'pdf_url' => $this->pdf_path ? \Illuminate\Support\Facades\Storage::disk('public')->url($this->pdf_path) : null,
            'page_start' => $this->page_start,
            'page_end' => $this->page_end,
            'issue' => new IssueResource($this->whenLoaded('issue')),
            'authors' => AuthorResource::collection($this->whenLoaded('authors')),
            'keywords' => KeywordResource::collection($this->whenLoaded('keywords')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
