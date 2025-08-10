<?php

namespace App\Http\Controllers;

use App\Services\AIContentService;
use App\Services\WhatsAppService;
use App\Services\AutomationService;
use App\Models\Client;
use App\Models\SocialPost;
use App\Models\Article;
use App\Models\ContentTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarketingAssistantController extends Controller
{
    private AIContentService $aiService;
    private WhatsAppService $whatsappService;
    private AutomationService $automationService;

    public function __construct(
        AIContentService $aiService,
        WhatsAppService $whatsappService,
        AutomationService $automationService
    ) {
        $this->aiService = $aiService;
        $this->whatsappService = $whatsappService;
        $this->automationService = $automationService;
    }

    public function dashboard()
    {
        $user = auth()->user();
        
        $stats = [
            'total_clients' => Client::where('user_id', $user->id)->count(),
            'active_clients' => Client::where('user_id', $user->id)->active()->count(),
            'posts_this_month' => SocialPost::where('user_id', $user->id)
                ->whereMonth('created_at', now()->month)->count(),
            'articles_published' => Article::where('user_id', $user->id)
                ->where('status', Article::STATUS_PUBLISHED)->count(),
            'messages_sent_today' => \App\Models\Message::where('user_id', $user->id)
                ->whereDate('created_at', today())->count(),
            'automation_stats' => $this->automationService->getAutomationStatistics($user->id)
        ];

        $recentPosts = SocialPost::where('user_id', $user->id)
            ->with('template')
            ->latest()
            ->take(5)
            ->get();

        $recentArticles = Article::where('user_id', $user->id)
            ->latest()
            ->take(5)
            ->get();

        $upcomingBirthdays = Client::where('user_id', $user->id)
            ->whereNotNull('birthday')
            ->whereRaw('DATE_FORMAT(birthday, "%m-%d") BETWEEN ? AND ?', [
                now()->format('m-d'),
                now()->addDays(7)->format('m-d')
            ])
            ->get();

        return Inertia::render('MarketingAssistant/Dashboard', [
            'stats' => $stats,
            'recentPosts' => $recentPosts,
            'recentArticles' => $recentArticles,
            'upcomingBirthdays' => $upcomingBirthdays
        ]);
    }

    public function chat()
    {
        return Inertia::render('MarketingAssistant/Chat');
    }

    public function chatMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'context' => 'array'
        ]);

        $response = $this->aiService->generateChatResponse(
            $request->message,
            $request->context ?? []
        );

        return response()->json($response);
    }

    public function generateContent(Request $request)
    {
        $request->validate([
            'type' => 'required|in:post,article,flyer,message',
            'topic' => 'required|string|max:200',
            'tone' => 'string|max:50',
            'platforms' => 'array',
            'target_audience' => 'string|max:100',
            'word_count' => 'integer|min:100|max:2000',
            'keywords' => 'string|max:200'
        ]);

        $result = match($request->type) {
            'post' => $this->aiService->generateSocialPost(
                $request->topic,
                $request->tone ?? 'professionnel',
                $request->platforms ?? ['facebook'],
                $request->target_audience
            ),
            'article' => $this->aiService->generateArticle(
                $request->topic,
                $request->keywords ?? '',
                $request->word_count ?? 800,
                $request->tone ?? 'informatif'
            ),
            'flyer' => $this->aiService->generateFlyerContent(
                $request->topic,
                auth()->user()->name ?? 'Mon Entreprise'
            ),
            default => ['success' => false, 'error' => 'Type de contenu non supporté']
        };

        return response()->json($result);
    }

    public function saveGeneratedContent(Request $request)
    {
        $request->validate([
            'type' => 'required|in:post,article,flyer',
            'content' => 'required|array',
            'title' => 'string|max:200'
        ]);

        $user = auth()->user();

        switch ($request->type) {
            case 'post':
                $post = SocialPost::create([
                    'user_id' => $user->id,
                    'title' => $request->title ?? 'Post généré par IA',
                    'content' => $request->content['content'] ?? '',
                    'platforms' => $request->content['platforms'] ?? ['facebook'],
                    'status' => SocialPost::STATUS_DRAFT,
                    'ai_generated' => true
                ]);

                if (isset($request->content['hashtags'])) {
                    $post->attachTags($request->content['hashtags']);
                }

                return response()->json(['success' => true, 'id' => $post->id]);

            case 'article':
                $article = Article::create([
                    'user_id' => $user->id,
                    'title' => $request->content['title'] ?? $request->title,
                    'slug' => \Str::slug($request->content['title'] ?? $request->title),
                    'content' => $request->content['content'] ?? '',
                    'excerpt' => $request->content['excerpt'] ?? '',
                    'meta_description' => $request->content['meta_description'] ?? '',
                    'reading_time' => $request->content['reading_time'] ?? 5,
                    'status' => Article::STATUS_DRAFT,
                    'ai_generated' => true
                ]);

                return response()->json(['success' => true, 'id' => $article->id]);

            default:
                return response()->json(['success' => false, 'error' => 'Type non supporté']);
        }
    }

    public function whatsappConversations()
    {
        $conversations = Client::where('user_id', auth()->id())
            ->whereHas('messages', function($query) {
                $query->where('type', 'whatsapp');
            })
            ->with(['messages' => function($query) {
                $query->where('type', 'whatsapp')->latest()->take(10);
            }])
            ->get();

        return Inertia::render('MarketingAssistant/WhatsAppConversations', [
            'conversations' => $conversations
        ]);
    }

    public function sendWhatsAppMessage(Request $request)
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'message' => 'required|string|max:1600'
        ]);

        $client = Client::where('user_id', auth()->id())->findOrFail($request->client_id);
        
        $result = $this->whatsappService->sendMessage($client, $request->message, auth()->id());

        return response()->json([
            'success' => $result->status !== 'failed',
            'message' => $result
        ]);
    }

    public function bulkWhatsAppMessage(Request $request)
    {
        $request->validate([
            'client_ids' => 'required|array|min:1',
            'client_ids.*' => 'exists:clients,id',
            'message' => 'required|string|max:1600',
            'use_ai_personalization' => 'boolean'
        ]);

        $clients = Client::where('user_id', auth()->id())
            ->whereIn('id', $request->client_ids)
            ->get();

        $results = [];

        foreach ($clients as $client) {
            $message = $request->message;

            // Personnalisation avec IA si demandée
            if ($request->use_ai_personalization) {
                $aiResult = $this->aiService->generatePersonalizedMessage($client, 'message_personnalisé');
                if ($aiResult['success']) {
                    $message = $aiResult['message'];
                }
            }

            $result = $this->whatsappService->sendMessage($client, $message, auth()->id());
            $results[] = [
                'client_id' => $client->id,
                'client_name' => $client->name,
                'success' => $result->status !== 'failed',
                'message_id' => $result->id
            ];

            // Délai pour éviter les limites de taux
            usleep(200000); // 200ms
        }

        return response()->json([
            'success' => true,
            'results' => $results,
            'total_sent' => count(array_filter($results, fn($r) => $r['success']))
        ]);
    }

    public function schedulePost(Request $request)
    {
        $request->validate([
            'post_id' => 'required|exists:social_posts,id',
            'scheduled_at' => 'required|date|after:now'
        ]);

        $post = SocialPost::where('user_id', auth()->id())->findOrFail($request->post_id);

        if (!$post->canBeScheduled()) {
            return response()->json(['success' => false, 'error' => 'Ce post ne peut pas être programmé']);
        }

        $post->update([
            'scheduled_at' => $request->scheduled_at,
            'status' => SocialPost::STATUS_SCHEDULED
        ]);

        return response()->json(['success' => true]);
    }

    public function createAutomationRule(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'trigger_type' => 'required|string',
            'trigger_conditions' => 'required|array',
            'action_type' => 'required|string',
            'action_data' => 'required|array'
        ]);

        $rule = \App\Models\AutomationRule::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'description' => $request->description ?? '',
            'trigger_type' => $request->trigger_type,
            'trigger_conditions' => $request->trigger_conditions,
            'action_type' => $request->action_type,
            'action_data' => $request->action_data,
            'status' => \App\Models\AutomationRule::STATUS_ACTIVE
        ]);

        return response()->json(['success' => true, 'rule' => $rule]);
    }

    public function createSeasonalReminder(Request $request)
    {
        $request->validate([
            'occasion' => 'required|string|max:100',
            'date' => 'required|string|regex:/^\d{2}-\d{2}$/',
            'message' => 'required|string|max:500'
        ]);

        $rule = $this->automationService->createSeasonalReminder(
            $request->occasion,
            $request->date,
            $request->message
        );

        return response()->json(['success' => true, 'rule' => $rule]);
    }

    public function optimizeContent(Request $request)
    {
        $request->validate([
            'content' => 'required|string',
            'platform' => 'required|string',
            'objective' => 'string'
        ]);

        $result = $this->aiService->optimizeContent(
            $request->content,
            $request->platform,
            $request->objective ?? 'engagement'
        );

        return response()->json($result);
    }

    public function getTemplates()
    {
        $templates = ContentTemplate::where(function($query) {
            $query->where('user_id', auth()->id())
                  ->orWhere('is_public', true);
        })->get();

        return response()->json($templates);
    }

    public function saveTemplate(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'type' => 'required|string',
            'category' => 'required|string',
            'content_structure' => 'required|string',
            'variables' => 'array',
            'default_values' => 'array',
            'is_public' => 'boolean'
        ]);

        $template = ContentTemplate::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'description' => $request->description ?? '',
            'type' => $request->type,
            'category' => $request->category,
            'content_structure' => $request->content_structure,
            'variables' => $request->variables ?? [],
            'default_values' => $request->default_values ?? [],
            'is_public' => $request->is_public ?? false
        ]);

        return response()->json(['success' => true, 'template' => $template]);
    }
}