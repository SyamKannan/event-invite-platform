<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRsvpRequest extends FormRequest
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
            'guest_name' => ['required', 'string', 'max:60'],
            'choice' => ['required', 'in:accept,decline'],
            'guest_count' => ['nullable', 'integer', 'min:1', 'max:10'],
            'meal_preference' => ['nullable', 'string', 'max:60'],
            'note' => ['nullable', 'string', 'max:500'],
            // Present when a guest changes an earlier response from the same
            // device — see Public\RsvpController.
            'rsvp_id' => ['sometimes', 'nullable', 'integer'],
            'edit_token' => ['required_with:rsvp_id', 'nullable', 'string', 'size:40'],
            // Honeypot: a hidden field real guests never see or fill. Bots that
            // auto-fill every input get a 422 instead of a saved submission.
            'website' => ['nullable', 'max:0'],
        ];
    }
}
