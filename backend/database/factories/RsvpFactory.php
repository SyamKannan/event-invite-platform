<?php

namespace Database\Factories;

use App\Models\Rsvp;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rsvp>
 */
class RsvpFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'guest_name' => fake()->name(),
            'choice' => fake()->randomElement(['accept', 'decline']),
            'guest_count' => fake()->numberBetween(1, 4),
            'meal_preference' => fake()->randomElement(['veg', 'non-veg', null]),
            'note' => fake()->optional()->sentence(),
        ];
    }
}
