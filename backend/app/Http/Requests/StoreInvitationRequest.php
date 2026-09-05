<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvitationRequest extends FormRequest
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
            'slug' => ['required', 'string', 'max:80', 'alpha_dash', 'unique:invitations,slug'],
            'type' => ['required', 'in:wedding,birthday'],
            'owner_id' => ['sometimes', 'nullable', 'exists:users,id'],
        ];
    }
}
