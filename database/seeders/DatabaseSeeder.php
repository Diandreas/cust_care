<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\EventTypesSeeder;
use Database\Seeders\CalendarEventsSeeder;
use Database\Seeders\SubscriptionPlanSeeder;


class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
        
        $this->call([
            // SubscriptionPlanSeeder::class,
            CalendarEventsSeeder::class,
            EventTypesSeeder::class
        ]);
    }
}
