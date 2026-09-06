<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'syamdasks14@gmail.com'],
            ['name' => 'Admin', 'username' => 'admin', 'password' => '12345678', 'role' => 'admin'],
        );
    }
}
