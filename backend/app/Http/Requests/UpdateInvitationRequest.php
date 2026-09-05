<?php

namespace App\Http\Requests;

use App\Support\EnvelopeAnimations;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInvitationRequest extends FormRequest
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
        $invitation = $this->route('invitation');
        $invitationId = $invitation->id;
        $isWedding = $invitation->type === 'wedding';
        $allowedRoles = $isWedding ? ['bride', 'groom'] : ['celebrant'];

        return [
            // Basics
            'slug' => ['sometimes', 'string', 'max:80', 'alpha_dash', Rule::unique('invitations', 'slug')->ignore($invitationId)],
            'is_published' => ['sometimes', 'boolean'],
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'theme' => ['sometimes', 'nullable', 'array'],
            'story_layout' => ['sometimes', 'string', Rule::in(['constellation', 'timeline', 'horizontal', 'stacked', 'mosaic'])],
            'animation_intensity' => ['sometimes', 'string', Rule::in(['subtle', 'balanced', 'playful'])],
            'owner_id' => ['sometimes', 'nullable', 'exists:users,id'],

            // Detail
            'detail' => ['sometimes', 'array'],
            'detail.event_date' => ['sometimes', 'nullable', 'date'],
            'detail.display_date' => ['sometimes', 'nullable', 'string', 'max:120'],
            'detail.display_time' => ['sometimes', 'nullable', 'string', 'max:60'],
            'detail.display_location' => ['sometimes', 'nullable', 'string', 'max:120'],
            'detail.hero_image' => ['sometimes', 'nullable', 'string'],
            'detail.hero_overline' => ['sometimes', 'nullable', 'string', 'max:120'],
            'detail.hero_tagline' => ['sometimes', 'nullable', 'string', 'max:120'],
            'detail.envelope_overline' => ['sometimes', 'nullable', 'string', 'max:120'],
            'detail.envelope_cta' => ['sometimes', 'nullable', 'string', 'max:60'],
            'detail.envelope_animation' => ['sometimes', 'nullable', 'string', Rule::in(array_keys(EnvelopeAnimations::ALL))],
            'detail.music_enabled' => ['sometimes', 'boolean'],
            'detail.music_src' => ['sometimes', 'nullable', 'string'],
            'detail.contact_phone_primary' => ['sometimes', 'nullable', 'string', 'max:30'],
            'detail.contact_phone_secondary' => ['sometimes', 'nullable', 'string', 'max:30'],
            'detail.contact_email' => ['sometimes', 'nullable', 'email', 'max:120'],
            'detail.contact_instagram' => ['sometimes', 'nullable', 'string', 'max:60'],
            'detail.floating_decor_enabled' => ['sometimes', 'boolean'],
            'detail.floating_decor_count' => ['sometimes', 'integer', 'min:0', 'max:60'],
            'detail.connector' => [$isWedding ? 'sometimes' : 'prohibited', 'nullable', 'string', 'max:10'],
            'detail.show_bride' => [$isWedding ? 'sometimes' : 'prohibited', 'boolean'],
            'detail.show_groom' => [$isWedding ? 'sometimes' : 'prohibited', 'boolean'],
            'detail.celebrant_age' => [$isWedding ? 'prohibited' : 'sometimes', 'nullable', 'integer', 'min:0', 'max:150'],
            'detail.celebrant_turning_text' => [$isWedding ? 'prohibited' : 'sometimes', 'nullable', 'string', 'max:60'],

            // People (bride/groom, or celebrant) — replaced wholesale on save.
            // Role set is restricted to the invitation's own type so a wedding/birthday
            // can never end up with the other type's person rows.
            'people' => ['sometimes', 'array'],
            'people.*.role' => ['required_with:people', Rule::in($allowedRoles)],
            'people.*.first_name' => ['required_with:people', 'string', 'max:60'],
            'people.*.parents_text' => ['sometimes', 'nullable', 'string', 'max:255'],
            'people.*.photo' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
