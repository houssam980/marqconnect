<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin 1: Mohammed
        User::firstOrCreate(
            ['email' => 'mohammed@marqen.com'],
            [
                'name' => 'Mohammed',
                'password' => Hash::make('MohammedMARQDmin142335'),
                'role' => 'admin',
            ]
        );

        // Create Admin 2: Houcine
        User::firstOrCreate(
            ['email' => 'houcine@marqen.com'],
            [
                'name' => 'Houcine',
                'password' => Hash::make('HoucineMARQmin53452678'),
                'role' => 'admin',
            ]
        );

        $this->command->info('Admin accounts created successfully!');
        $this->command->info('Admin 1: mohammed@marqen.com');
        $this->command->info('Admin 2: houcine@marqen.com');
    }
}



