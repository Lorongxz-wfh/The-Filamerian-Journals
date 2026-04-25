<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IssueResource extends JsonResource
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
            'issue_number' => $this->issue_number,
            'published_at' => $this->published_at,
            'volume' => new VolumeResource($this->whenLoaded('volume')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
