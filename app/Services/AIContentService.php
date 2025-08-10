<?php

namespace App\Services;

use OpenAI\Client as OpenAIClient;
use App\Models\ContentTemplate;
use App\Models\Client;
use Illuminate\Support\Facades\Log;

class AIContentService
{
    private OpenAIClient $openai;

    public function __construct()
    {
        $this->openai = \OpenAI::client(config('services.openai.api_key'));
    }

    public function generateSocialPost(string $topic, string $tone = 'professionnel', array $platforms = ['facebook'], ?string $targetAudience = null): array
    {
        $platformsText = implode(', ', $platforms);
        $audienceText = $targetAudience ? " pour une audience de $targetAudience" : '';
        
        $prompt = "Génère un post pour les réseaux sociaux ($platformsText) sur le sujet : '$topic'. 
                  Ton : $tone$audienceText.
                  Le post doit être engageant, inclure des hashtags pertinents et être adapté aux plateformes mentionnées.
                  Limite : 280 caractères pour Twitter, 500 pour les autres.
                  Réponds en JSON avec les champs : content, hashtags, platforms";

        try {
            $response = $this->openai->chat()->create([
                'model' => 'gpt-4',
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert en marketing digital et création de contenu pour les réseaux sociaux.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 800,
                'temperature' => 0.7
            ]);

            $content = json_decode($response->choices[0]->message->content, true);
            
            return [
                'success' => true,
                'content' => $content['content'] ?? '',
                'hashtags' => $content['hashtags'] ?? [],
                'platforms' => $content['platforms'] ?? $platforms,
                'ai_generated' => true
            ];

        } catch (\Exception $e) {
            Log::error('AI content generation failed: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => 'Erreur lors de la génération du contenu : ' . $e->getMessage()
            ];
        }
    }

    public function generateArticle(string $title, string $keywords, int $wordCount = 800, string $tone = 'informatif'): array
    {
        $prompt = "Rédige un article de blog complet de $wordCount mots sur le sujet : '$title'.
                  Mots-clés à inclure : $keywords
                  Ton : $tone
                  
                  Structure attendue :
                  - Introduction accrocheuse
                  - 3-4 sections principales avec sous-titres
                  - Conclusion avec appel à l'action
                  - Meta description (150 caractères max)
                  
                  Réponds en JSON avec les champs : title, content, excerpt, meta_description, reading_time, sections";

        try {
            $response = $this->openai->chat()->create([
                'model' => 'gpt-4',
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un rédacteur web expert spécialisé dans la création d\'articles optimisés pour le SEO.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 2000,
                'temperature' => 0.6
            ]);

            $content = json_decode($response->choices[0]->message->content, true);
            
            return [
                'success' => true,
                'title' => $content['title'] ?? $title,
                'content' => $content['content'] ?? '',
                'excerpt' => $content['excerpt'] ?? '',
                'meta_description' => $content['meta_description'] ?? '',
                'reading_time' => $content['reading_time'] ?? ceil($wordCount / 200),
                'sections' => $content['sections'] ?? [],
                'ai_generated' => true
            ];

        } catch (\Exception $e) {
            Log::error('AI article generation failed: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => 'Erreur lors de la génération de l\'article : ' . $e->getMessage()
            ];
        }
    }

    public function generatePersonalizedMessage(Client $client, string $occasion, ContentTemplate $template = null): array
    {
        $clientInfo = "Nom : {$client->name}";
        if ($client->birthday) {
            $clientInfo .= ", Anniversaire : {$client->birthday->format('d/m')}";
        }
        if ($client->tags->count() > 0) {
            $clientInfo .= ", Intérêts : " . $client->tags->pluck('name')->implode(', ');
        }

        $templateInfo = $template ? "Template de base : {$template->content_structure}" : "";
        
        $prompt = "Génère un message personnalisé pour l'occasion '$occasion'.
                  Informations client : $clientInfo
                  $templateInfo
                  
                  Le message doit être :
                  - Personnalisé et chaleureux
                  - Adapté à l'occasion
                  - Professionnel mais amical
                  - Maximum 160 caractères pour SMS, 300 pour email
                  
                  Réponds en JSON avec les champs : message, type_recommande (sms/email/whatsapp), timing_recommande";

        try {
            $response = $this->openai->chat()->create([
                'model' => 'gpt-4',
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un assistant marketing spécialisé dans la personnalisation des communications clients.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 500,
                'temperature' => 0.8
            ]);

            $content = json_decode($response->choices[0]->message->content, true);
            
            return [
                'success' => true,
                'message' => $content['message'] ?? '',
                'type_recommande' => $content['type_recommande'] ?? 'sms',
                'timing_recommande' => $content['timing_recommande'] ?? '',
                'ai_generated' => true
            ];

        } catch (\Exception $e) {
            Log::error('AI personalized message generation failed: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => 'Erreur lors de la génération du message : ' . $e->getMessage()
            ];
        }
    }

    public function generateFlyerContent(string $purpose, string $business, array $details = []): array
    {
        $detailsText = !empty($details) ? "Détails spécifiques : " . implode(', ', $details) : '';
        
        $prompt = "Génère le contenu pour un flyer pour l'entreprise '$business' avec l'objectif : '$purpose'.
                  $detailsText
                  
                  Le contenu doit inclure :
                  - Titre accrocheur
                  - Sous-titre explicatif
                  - 3-4 points clés
                  - Appel à l'action
                  - Suggestions de couleurs et style
                  
                  Réponds en JSON avec les champs : title, subtitle, key_points, call_to_action, color_suggestions, style_suggestions";

        try {
            $response = $this->openai->chat()->create([
                'model' => 'gpt-4',
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un designer graphique et créateur de contenu marketing spécialisé dans les flyers promotionnels.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 800,
                'temperature' => 0.7
            ]);

            $content = json_decode($response->choices[0]->message->content, true);
            
            return [
                'success' => true,
                'title' => $content['title'] ?? '',
                'subtitle' => $content['subtitle'] ?? '',
                'key_points' => $content['key_points'] ?? [],
                'call_to_action' => $content['call_to_action'] ?? '',
                'color_suggestions' => $content['color_suggestions'] ?? [],
                'style_suggestions' => $content['style_suggestions'] ?? [],
                'ai_generated' => true
            ];

        } catch (\Exception $e) {
            Log::error('AI flyer content generation failed: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => 'Erreur lors de la génération du contenu du flyer : ' . $e->getMessage()
            ];
        }
    }

    public function generateChatResponse(string $userMessage, array $context = []): array
    {
        $contextText = !empty($context) ? "Contexte : " . implode(', ', $context) : '';
        
        $prompt = "L'utilisateur dit : '$userMessage'
                  $contextText
                  
                  Réponds en tant qu'assistant marketing digital. Tu peux :
                  - Aider à créer du contenu
                  - Donner des conseils marketing
                  - Suggérer des stratégies
                  - Programmer des publications
                  - Gérer les contacts clients
                  
                  Sois utile, concis et professionnel.";

        try {
            $response = $this->openai->chat()->create([
                'model' => 'gpt-4',
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un assistant marketing digital expert, aidant les entreprises avec leur communication et leur contenu.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 500,
                'temperature' => 0.7
            ]);

            return [
                'success' => true,
                'response' => $response->choices[0]->message->content,
                'ai_generated' => true
            ];

        } catch (\Exception $e) {
            Log::error('AI chat response generation failed: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => 'Erreur lors de la génération de la réponse : ' . $e->getMessage(),
                'response' => 'Je suis désolé, je rencontre un problème technique. Pouvez-vous reformuler votre question ?'
            ];
        }
    }

    public function optimizeContent(string $content, string $platform, string $objective = 'engagement'): array
    {
        $prompt = "Optimise ce contenu pour $platform avec l'objectif : $objective
                  
                  Contenu original : '$content'
                  
                  Suggestions d'amélioration pour :
                  - Meilleur engagement
                  - Respect des bonnes pratiques de la plateforme
                  - Optimisation SEO si applicable
                  - Hashtags pertinents
                  
                  Réponds en JSON avec les champs : optimized_content, improvements, hashtags, best_time_to_post";

        try {
            $response = $this->openai->chat()->create([
                'model' => 'gpt-4',
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert en optimisation de contenu pour les réseaux sociaux et le marketing digital.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 600,
                'temperature' => 0.6
            ]);

            $optimized = json_decode($response->choices[0]->message->content, true);
            
            return [
                'success' => true,
                'optimized_content' => $optimized['optimized_content'] ?? $content,
                'improvements' => $optimized['improvements'] ?? [],
                'hashtags' => $optimized['hashtags'] ?? [],
                'best_time_to_post' => $optimized['best_time_to_post'] ?? '',
                'ai_generated' => true
            ];

        } catch (\Exception $e) {
            Log::error('AI content optimization failed: ' . $e->getMessage());
            
            return [
                'success' => false,
                'error' => 'Erreur lors de l\'optimisation du contenu : ' . $e->getMessage()
            ];
        }
    }
}