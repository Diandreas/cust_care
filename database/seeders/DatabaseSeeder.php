<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Client;
use App\Models\Tag;
use App\Models\Campaign;
use App\Models\Template;
use App\Models\Message;
use App\Models\Visit;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Database\Seeders\CalendarEventsSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Database\Seeders\TestUsersSeeder;
use Database\Seeders\NameDaysSeeder;

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
            SubscriptionPlanSeeder::class,
            CalendarEventsSeeder::class,
            NameDaysSeeder::class,
            TestUsersSeeder::class,
        ]);
    }
}
