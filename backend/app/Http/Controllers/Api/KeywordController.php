<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Keyword;
use App\Http\Resources\KeywordResource;
use Illuminate\Http\Request;

class KeywordController extends Controller
{
    public function index()
    {
        return KeywordResource::collection(Keyword::paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:keywords,name',
        ]);

        $keyword = Keyword::create($validated);

        return new KeywordResource($keyword);
    }

    public function show(Keyword $keyword)
    {
        return new KeywordResource($keyword);
    }

    public function update(Request $request, Keyword $keyword)
    {
        $validated = $request->validate([
            'name' => 'string|max:255|unique:keywords,name,' . $keyword->id,
        ]);

        $keyword->update($validated);

        return new KeywordResource($keyword);
    }

    public function destroy(Keyword $keyword)
    {
        $keyword->delete();

        return response()->noContent();
    }
}
