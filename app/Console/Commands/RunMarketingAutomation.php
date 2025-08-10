<?php

namespace App\Console\Commands;

use App\Jobs\ProcessAutomationRules;
use App\Jobs\PublishScheduledPosts;
use App\Services\AutomationService;
use Illuminate\Console\Command;

class RunMarketingAutomation extends Command
{
    protected $signature = 'marketing:automation {--rules : Execute automation rules} {--posts : Publish scheduled posts} {--all : Execute all automation tasks}';
    protected $description = 'Execute marketing automation tasks';

    public function handle(): int
    {
        if ($this->option('all') || (!$this->option('rules') && !$this->option('posts'))) {
            $this->info('Running all marketing automation tasks...');
            $this->runAutomationRules();
            $this->publishScheduledPosts();
        } else {
            if ($this->option('rules')) {
                $this->runAutomationRules();
            }
            
            if ($this->option('posts')) {
                $this->publishScheduledPosts();
            }
        }

        $this->info('Marketing automation tasks completed successfully!');
        return Command::SUCCESS;
    }

    private function runAutomationRules(): void
    {
        $this->info('Processing automation rules...');
        ProcessAutomationRules::dispatch();
    }

    private function publishScheduledPosts(): void
    {
        $this->info('Publishing scheduled posts...');
        PublishScheduledPosts::dispatch();
    }
}