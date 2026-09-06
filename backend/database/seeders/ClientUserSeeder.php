<?php

namespace Database\Seeders;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Database\Seeder;

class ClientUserSeeder extends Seeder
{
    public function run(): void
    {
        $client = User::query()->updateOrCreate(
            ['email' => 'client-demo@example.com'],
            ['name' => 'Syam & Swathi', 'username' => 'syam-swathi', 'password' => 'clientpass123', 'role' => 'client'],
        );

        Invitation::query()
            ->where('slug', 'syam-and-swathi')
            ->update(['owner_id' => $client->id]);
    }
}
