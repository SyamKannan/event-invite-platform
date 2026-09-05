<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMilestoneRequest extends FormRequest
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
            'x' => ['required', 'integer', 'min:0', 'max:100'],
            'y' => ['required', 'integer', 'min:0', 'max:100'],
            'date_label' => ['required', 'string', 'max:60'],
            'title' => ['required', 'string', 'max:80'],
            'description' => ['nullable', 'string', 'max:1000'],
            'image' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
