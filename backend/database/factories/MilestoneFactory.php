<?php

namespace Database\Factories;

use App\Models\Milestone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Milestone>
 */
class MilestoneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'date_label' => fake()->year(),
            'title' => fake()->words(3, true),
            'description' => fake()->sentence(),
            'sort_order' => 0,
        ];
    }
}
