<?php

namespace Database\Seeders;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo client account owning the demo wedding. Same rule as the admin
 * seeder: a known password only in a local environment.
 */
class ClientUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('DEMO_CLIENT_PASSWORD') ?: (app()->isLocal() ? 'clientpass123' : Str::password(20));

        $client = User::query()->updateOrCreate(
            ['email' => 'client-demo@example.com'],
            ['name' => 'Syam & Swathi', 'username' => 'syam-swathi', 'password' => $password, 'role' => 'client'],
        );

        Invitation::query()
            ->where('slug', 'syam-and-swathi')
            ->update(['owner_id' => $client->id]);
    }
}
