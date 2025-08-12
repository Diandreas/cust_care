<?php

namespace App\Http\Controllers;

use App\Services\AIContentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class MarketingAIController extends Controller
{
    protected $aiService;

    public function __construct(AIContentService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Chat avec l'IA
     */
    public function chat(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $response = $this->aiService->generateChatResponse(
                $request->message,
                auth()->id()
            );

            return back()->with('aiResponse', $response);
        } catch (\Exception $e) {
            Log::error('Erreur lors du chat IA: ' . $e->getMessage());
            return back()->withErrors(['ai' => 'Erreur lors de la communication avec l\'IA: ' . $e->getMessage()]);
        }
    }

    /**
     * Générer du contenu marketing
     */
    public function generateContent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|string|in:social_post,article,email,flyer,ad_copy',
            'subject' => 'required|string|max:255',
            'tone' => 'required|string|in:professional,casual,friendly,persuasive,informative',
            'platform' => 'required|string|in:instagram,facebook,twitter,linkedin,general',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $content = $this->aiService->generateMarketingContent(
                $request->type,
                $request->subject,
                [
                    'tone' => $request->tone,
                    'platform' => $request->platform,
                    'user_id' => auth()->id(),
                ]
            );

            return back()->with('generatedContent', $content);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération de contenu: ' . $e->getMessage());
            return back()->withErrors(['generation' => 'Erreur lors de la génération: ' . $e->getMessage()]);
        }
    }

    /**
     * Générer un article de blog
     */
    public function generateArticle(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'topic' => 'required|string|max:255',
            'keywords' => 'nullable|string|max:500',
            'word_count' => 'required|integer|min:100|max:5000',
            'tone' => 'required|string|in:professional,casual,friendly,informative',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $article = $this->aiService->generateArticle(
                $request->topic,
                $request->keywords,
                $request->word_count,
                $request->tone,
                auth()->id()
            );

            return response()->json([
                'success' => true,
                'article' => $article
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération d\'article: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un post pour réseaux sociaux
     */
    public function generateSocialPost(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'topic' => 'required|string|max:255',
            'platforms' => 'required|array|min:1',
            'platforms.*' => 'string|in:instagram,facebook,twitter,linkedin',
            'tone' => 'required|string|in:professional,casual,friendly,persuasive',
            'include_hashtags' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $post = $this->aiService->generateSocialMediaPost(
                $request->topic,
                $request->platforms,
                $request->tone,
                [
                    'include_hashtags' => $request->include_hashtags ?? true,
                    'user_id' => auth()->id(),
                ]
            );

            return response()->json([
                'success' => true,
                'post' => $post
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération de post social: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer du contenu pour flyer
     */
    public function generateFlyerContent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'topic' => 'required|string|max:255',
            'format' => 'required|string|in:a4,a5,square,story,post',
            'requirements' => 'nullable|array',
            'tone' => 'required|string|in:professional,casual,friendly,persuasive',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $content = $this->aiService->generateFlyerContent(
                $request->topic,
                $request->format,
                [
                    'requirements' => $request->requirements ?? [],
                    'tone' => $request->tone,
                    'user_id' => auth()->id(),
                ]
            );

            return response()->json([
                'success' => true,
                'content' => $content
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération de contenu flyer: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un message personnalisé
     */
    public function generatePersonalizedMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_name' => 'required|string|max:255',
            'purpose' => 'required|string|in:birthday,anniversary,promotion,reminder,thank_you',
            'tone' => 'required|string|in:professional,casual,friendly,persuasive',
            'include_offer' => 'boolean',
            'offer_details' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $message = $this->aiService->generatePersonalizedMessage(
                $request->client_name,
                $request->purpose,
                [
                    'tone' => $request->tone,
                    'include_offer' => $request->include_offer ?? false,
                    'offer_details' => $request->offer_details,
                    'user_id' => auth()->id(),
                ]
            );

            return response()->json([
                'success' => true,
                'message' => $message
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération de message personnalisé: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Optimiser du contenu existant
     */
    public function optimizeContent(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:2000',
            'goal' => 'required|string|in:engagement,conversion,clarity,seo,tone',
            'target_audience' => 'nullable|string|max:255',
            'platform' => 'nullable|string|in:instagram,facebook,twitter,linkedin,website,email',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $optimizedContent = $this->aiService->optimizeContent(
                $request->content,
                $request->goal,
                [
                    'target_audience' => $request->target_audience,
                    'platform' => $request->platform,
                    'user_id' => auth()->id(),
                ]
            );

            return response()->json([
                'success' => true,
                'optimized_content' => $optimizedContent
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'optimisation de contenu: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'optimisation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer des suggestions marketing
     */
    public function generateSuggestions(Request $request)
    {
        try {
            $suggestions = $this->aiService->generateContentSuggestions(
                auth()->id(),
                [
                    'include_campaign_ideas' => true,
                    'include_content_ideas' => true,
                    'include_timing_suggestions' => true,
                ]
            );

            return response()->json([
                'success' => true,
                'suggestions' => $suggestions
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération de suggestions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération des suggestions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tester la connexion à l'IA
     */
    public function testConnection()
    {
        try {
            $result = $this->aiService->testConnection();
            
            return response()->json([
                'success' => true,
                'message' => 'Connexion à l\'IA réussie',
                'details' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur de connexion IA: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erreur de connexion: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques d'utilisation de l'IA
     */
    public function getUsageStats()
    {
        try {
            $stats = [
                'total_requests' => 0, // À implémenter avec un système de tracking
                'successful_requests' => 0,
                'failed_requests' => 0,
                'average_response_time' => 0,
                'most_used_features' => [],
                'cost_estimate' => 0,
            ];

            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des stats IA: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir l'historique des générations
     */
    public function getGenerationHistory(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'nullable|string|in:all,content,article,social_post,flyer,message,optimization',
            'limit' => 'nullable|integer|min:1|max:100',
            'offset' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // À implémenter avec un système de tracking des générations
            $history = [
                'generations' => [],
                'total' => 0,
                'has_more' => false,
            ];

            return response()->json([
                'success' => true,
                'history' => $history
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération de l\'historique: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération de l\'historique: ' . $e->getMessage()
            ], 500);
        }
    }
}