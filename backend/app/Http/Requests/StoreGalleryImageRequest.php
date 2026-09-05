<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGalleryImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'image' => ['required', 'string'],
            'alt' => ['nullable', 'string', 'max:120'],
            'span' => ['nullable', 'in:tall,wide'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
