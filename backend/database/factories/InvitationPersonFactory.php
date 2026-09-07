<?php

namespace Database\Factories;

use App\Models\InvitationPerson;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InvitationPerson>
 */
class InvitationPersonFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'role' => 'bride',
            'first_name' => fake()->firstName(),
        ];
    }
}
