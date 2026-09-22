<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Platform admin account. The password comes from ADMIN_PASSWORD; only a
 * local environment falls back to a known dev password — anywhere else
 * (e.g. seeding production on Railway) a random one is generated and
 * printed once, so a guessable admin/12345678 login can never ship.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('ADMIN_PASSWORD') ?: (app()->isLocal() ? '12345678' : Str::password(20));

        User::query()->updateOrCreate(
            ['email' => env('ADMIN_EMAIL', 'syamdasks14@gmail.com')],
            ['name' => 'Admin', 'username' => env('ADMIN_USERNAME', 'admin'), 'password' => $password, 'role' => 'admin'],
        );

        if (! env('ADMIN_PASSWORD') && ! app()->isLocal()) {
            $this->command?->warn("Generated admin password (save it now, it is not shown again): {$password}");
        }
    }
}
