<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWishRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:60'],
            'message' => ['required', 'string', 'max:500'],
            // Honeypot: a hidden field real guests never see or fill. Bots that
            // auto-fill every input get a 422 instead of a saved submission.
            'website' => ['nullable', 'max:0'],
        ];
    }
}
