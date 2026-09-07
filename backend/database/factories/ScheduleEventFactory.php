<?php

namespace Database\Factories;

use App\Models\ScheduleEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScheduleEvent>
 */
class ScheduleEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->words(2, true),
            'event_date' => fake()->date(),
            'event_time' => '10:00 AM',
            'venue' => fake()->company(),
            'sort_order' => 0,
        ];
    }
}
