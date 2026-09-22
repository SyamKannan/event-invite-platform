<?php

namespace App\Http\Requests;

use App\Support\EventTypes;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'type' => ['required', Rule::in(array_keys(EventTypes::ALL))],
            'owner_id' => ['sometimes', 'nullable', Rule::exists('users', 'id')->where('role', 'client')],
            // Initial palette (the type's default preset, resolved client-side
            // from themePresets.js) — sent with the create so it's one request.
            'theme' => ['sometimes', 'nullable', 'array:'.implode(',', UpdateInvitationRequest::THEME_KEYS)],
            'theme.*' => ['string', 'regex:/^\d{1,3} \d{1,3} \d{1,3}$/'],
        ];
    }
}
