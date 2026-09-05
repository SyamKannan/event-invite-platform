<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleEventRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:80'],
            'event_date' => ['required', 'date'],
            'event_time' => ['required', 'string', 'max:60'],
            'venue' => ['required', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            'map_url' => ['nullable', 'url', 'max:500'],
            'dresscode' => ['nullable', 'string', 'max:80'],
            'team' => ['nullable', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
