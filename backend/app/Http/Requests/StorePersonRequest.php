<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePersonRequest extends FormRequest
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
        $allowedRoles = $this->route('invitation')->type === 'wedding'
            ? ['bride', 'groom']
            : ['celebrant'];

        return [
            'role' => ['required', Rule::in($allowedRoles)],
            'first_name' => ['required', 'string', 'max:60'],
            'parents_text' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'string'],
        ];
    }
}
