<?php

namespace App\Jobs;

use App\Models\SocialPost;
use App\Services\SocialMediaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PublishScheduledPosts implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct()
    {
        //
    }

    public function handle(): void
    {
        $scheduledPosts = SocialPost::scheduledForNow()->get();

        foreach ($scheduledPosts as $post) {
            try {
                $this->publishPost($post);
                
                $post->update([
                    'status' => SocialPost::STATUS_PUBLISHED,
                    'published_at' => now()
                ]);

                Log::info("Post published successfully", ['post_id' => $post->id]);

            } catch (\Exception $e) {
                $post->update([
                    'status' => SocialPost::STATUS_FAILED,
                    'error_message' => $e->getMessage()
                ]);

                Log::error("Failed to publish post", [
                    'post_id' => $post->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    private function publishPost(SocialPost $post): void
    {
        foreach ($post->platforms as $platform) {
            match($platform) {
                SocialPost::PLATFORM_FACEBOOK => $this->publishToFacebook($post),
                SocialPost::PLATFORM_INSTAGRAM => $this->publishToInstagram($post),
                SocialPost::PLATFORM_TWITTER => $this->publishToTwitter($post),
                SocialPost::PLATFORM_LINKEDIN => $this->publishToLinkedIn($post),
                default => Log::warning("Unsupported platform: $platform")
            };
        }
    }

    private function publishToFacebook(SocialPost $post): void
    {
        // Implémentation de l'API Facebook
        // Nécessite la configuration des tokens d'accès Facebook
        Log::info("Publishing to Facebook", ['post_id' => $post->id]);
    }

    private function publishToInstagram(SocialPost $post): void
    {
        // Implémentation de l'API Instagram
        Log::info("Publishing to Instagram", ['post_id' => $post->id]);
    }

    private function publishToTwitter(SocialPost $post): void
    {
        // Implémentation de l'API Twitter/X
        Log::info("Publishing to Twitter", ['post_id' => $post->id]);
    }

    private function publishToLinkedIn(SocialPost $post): void
    {
        // Implémentation de l'API LinkedIn
        Log::info("Publishing to LinkedIn", ['post_id' => $post->id]);
    }
}