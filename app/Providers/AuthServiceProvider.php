<?php

namespace App\Providers;

use App\Models\Tag;
use App\Models\Client;
use App\Models\Campaign;
use App\Policies\TagPolicy;
use App\Policies\ClientPolicy;
use App\Policies\CampaignPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Tag::class => TagPolicy::class,
        Client::class => ClientPolicy::class,
        Campaign::class => CampaignPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
} 