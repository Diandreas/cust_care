<?php

namespace App\Services;

use App\Models\User;
use App\Models\Client;
use App\Models\GeneratedContent;
use App\Models\AiConversation;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AIContentService
{
    protected $openAIClient;

    public function __construct()
    {
        if (config('openai.api_key')) {
            try {
                $this->openAIClient = \OpenAI\Laravel\Facades\OpenAI::client();
            } catch (\Exception $e) {
                // Client IA non disponible, continuer sans
                $this->openAIClient = null;
            }
        }
    }

    /**
     * Générer une réponse de chat contextuelle
     */
    public function generateChatResponse(string $message, array $context = [], ?User $user = null): array
    {
        try {
            if (!$this->openAIClient) {
                throw new \Exception('OpenAI client not configured');
            }

            // Construire le prompt avec contexte
            $systemPrompt = $this->buildSystemPrompt($context, $user);
            
            $messages = [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $message]
            ];

            // Ajouter l'historique si disponible
            if (isset($context['conversation_history'])) {
                array_splice($messages, 1, 0, $context['conversation_history']);
            }

            $response = $this->openAIClient->chat()->create([
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => $messages,
                'max_tokens' => config('services.openai.max_tokens', 2000),
                'temperature' => 0.7
            ]);

            $content = $response->choices[0]->message->content ?? '';

            // Sauvegarder la conversation si utilisateur connecté
            if ($user) {
                $this->saveConversation($user, $message, $content, $context);
            }

            return [
                'success' => true,
                'content' => $content,
                'usage' => [
                    'prompt_tokens' => $response->usage->promptTokens ?? 0,
                    'completion_tokens' => $response->usage->completionTokens ?? 0,
                    'total_tokens' => $response->usage->totalTokens ?? 0
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Erreur génération chat IA', [
                'message' => $message,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de la génération de la réponse IA',
                'details' => $e->getMessage()
            ];
        }
    }

    /**
     * Générer un post pour les réseaux sociaux
     */
    public function generateSocialPost(string $topic, string $platform, string $tone = 'professional', array $parameters = [], ?User $user = null): array
    {
        try {
            $platformRules = $this->getPlatformRules($platform);
            
            $prompt = "Tu es un expert en marketing digital spécialisé dans la création de contenu pour {$platform}.\n\n";
            $prompt .= "Crée un post engageant sur le sujet : \"{$topic}\"\n\n";
            $prompt .= "Contraintes pour {$platform}:\n";
            $prompt .= "- {$platformRules['description']}\n";
            $prompt .= "- Longueur idéale : {$platformRules['max_chars']} caractères maximum\n";
            $prompt .= "- Ton : {$tone}\n";
            $prompt .= "- Inclure {$platformRules['hashtags_count']} hashtags pertinents\n";
            
            if (isset($parameters['target_audience'])) {
                $prompt .= "- Audience cible : {$parameters['target_audience']}\n";
            }
            
            if (isset($parameters['call_to_action'])) {
                $prompt .= "- Call-to-action : {$parameters['call_to_action']}\n";
            }
            
            $prompt .= "\nRetourne uniquement le contenu du post, prêt à publier.";

            $response = $this->openAIClient->chat()->create([
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert en création de contenu pour les réseaux sociaux.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 1000,
                'temperature' => 0.8
            ]);

            $content = $response->choices[0]->message->content ?? '';

            // Sauvegarder le contenu généré
            if ($user) {
                $generatedContent = GeneratedContent::create([
                    'user_id' => $user->id,
                    'type' => 'social_post',
                    'platform' => $platform,
                    'topic' => $topic,
                    'content' => $content,
                    'parameters' => array_merge($parameters, [
                        'tone' => $tone,
                        'platform_rules' => $platformRules
                    ]),
                    'prompt_used' => $prompt,
                    'character_count' => strlen($content),
                    'word_count' => str_word_count($content)
                ]);
            }

            return [
                'success' => true,
                'content' => $content,
                'platform' => $platform,
                'character_count' => strlen($content),
                'word_count' => str_word_count($content),
                'hashtags' => $this->extractHashtags($content),
                'id' => $generatedContent->id ?? null
            ];

        } catch (\Exception $e) {
            Log::error('Erreur génération post social', [
                'topic' => $topic,
                'platform' => $platform,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de la génération du post'
            ];
        }
    }

    /**
     * Générer un article de blog
     */
    public function generateArticle(string $title, string $keywords, int $wordCount = 800, string $tone = 'informative', ?User $user = null): array
    {
        try {
            $prompt = "Rédige un article de blog complet et optimisé SEO.\n\n";
            $prompt .= "Titre : \"{$title}\"\n";
            $prompt .= "Mots-clés à inclure naturellement : {$keywords}\n";
            $prompt .= "Longueur cible : environ {$wordCount} mots\n";
            $prompt .= "Ton : {$tone}\n\n";
            $prompt .= "Structure attendue :\n";
            $prompt .= "1. Introduction accrocheuse\n";
            $prompt .= "2. 3-4 sections principales avec sous-titres H2\n";
            $prompt .= "3. Conclusion avec call-to-action\n\n";
            $prompt .= "Optimisations SEO :\n";
            $prompt .= "- Utiliser les mots-clés naturellement\n";
            $prompt .= "- Créer des sous-titres engageants\n";
            $prompt .= "- Inclure des listes à puces quand approprié\n";
            $prompt .= "- Rédiger pour l'humain d'abord, SEO ensuite\n\n";
            $prompt .= "Retourne l'article au format Markdown avec les titres et structure appropriés.";

            $response = $this->openAIClient->chat()->create([
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un rédacteur web expert en SEO et création de contenu engageant.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 3000,
                'temperature' => 0.7
            ]);

            $content = $response->choices[0]->message->content ?? '';

            // Sauvegarder l'article
            if ($user) {
                $generatedContent = GeneratedContent::create([
                    'user_id' => $user->id,
                    'type' => 'article',
                    'platform' => null,
                    'topic' => $title,
                    'content' => $content,
                    'parameters' => [
                        'keywords' => $keywords,
                        'target_word_count' => $wordCount,
                        'tone' => $tone
                    ],
                    'prompt_used' => $prompt,
                    'character_count' => strlen($content),
                    'word_count' => str_word_count($content)
                ]);
            }

            return [
                'success' => true,
                'content' => $content,
                'title' => $title,
                'word_count' => str_word_count($content),
                'character_count' => strlen($content),
                'reading_time' => ceil(str_word_count($content) / 200), // Temps de lecture estimé
                'id' => $generatedContent->id ?? null
            ];

        } catch (\Exception $e) {
            Log::error('Erreur génération article', [
                'title' => $title,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de la génération de l\'article'
            ];
        }
    }

    /**
     * Personnaliser un message pour un client spécifique
     */
    public function personalizeMessage(Client $client, string $template, array $context = []): array
    {
        try {
            // Variables client disponibles
            $clientData = [
                'nom' => $client->name,
                'prenom' => $client->first_name ?? explode(' ', $client->name)[0],
                'telephone' => $client->phone,
                'email' => $client->email,
                'derniere_visite' => $client->last_visit?->format('d/m/Y'),
                'tags' => $client->tags->pluck('name')->join(', ')
            ];

            $prompt = "Tu dois personnaliser ce message template pour un client spécifique.\n\n";
            $prompt .= "Template original :\n\"{$template}\"\n\n";
            $prompt .= "Informations du client :\n";
            foreach ($clientData as $key => $value) {
                if ($value) {
                    $prompt .= "- {$key}: {$value}\n";
                }
            }
            
            if (!empty($context)) {
                $prompt .= "\nContexte supplémentaire :\n";
                foreach ($context as $key => $value) {
                    $prompt .= "- {$key}: {$value}\n";
                }
            }
            
            $prompt .= "\nPersonnalise le message en :\n";
            $prompt .= "1. Remplaçant les variables par les vraies valeurs\n";
            $prompt .= "2. Adaptant le ton selon le profil client\n";
            $prompt .= "3. Gardant un style naturel et chaleureux\n";
            $prompt .= "4. Conservant l'objectif principal du message\n\n";
            $prompt .= "Retourne uniquement le message personnalisé final.";

            $response = $this->openAIClient->chat()->create([
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert en communication client et personnalisation de messages marketing.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 500,
                'temperature' => 0.6
            ]);

            $personalizedMessage = $response->choices[0]->message->content ?? '';

            return [
                'success' => true,
                'original_template' => $template,
                'personalized_message' => $personalizedMessage,
                'client_name' => $client->name,
                'variables_used' => $clientData
            ];

        } catch (\Exception $e) {
            Log::error('Erreur personnalisation message', [
                'client_id' => $client->id,
                'template' => $template,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de la personnalisation du message'
            ];
        }
    }

    /**
     * Construire le prompt système avec contexte
     */
    protected function buildSystemPrompt(array $context, ?User $user = null): string
    {
        $prompt = "Tu es un assistant marketing digital intelligent pour HelloBoost Customer Care.\n\n";
        
        $prompt .= "Tes compétences :\n";
        $prompt .= "- Création de contenu marketing (posts, articles, messages)\n";
        $prompt .= "- Conseils en stratégie digitale\n";
        $prompt .= "- Optimisation des campagnes\n";
        $prompt .= "- Analyse des performances\n";
        $prompt .= "- Support client et CRM\n\n";
        
        if ($user) {
            $prompt .= "Utilisateur connecté : {$user->name}\n";
            if ($user->business_type) {
                $prompt .= "Secteur d'activité : {$user->business_type}\n";
            }
        }
        
        if (isset($context['platform'])) {
            $prompt .= "Contexte : Conversation via {$context['platform']}\n";
        }
        
        if (isset($context['client_info'])) {
            $prompt .= "Client concerné : {$context['client_info']}\n";
        }
        
        $prompt .= "\nRéponds en français, sois concis mais informatif. Adapte tes réponses selon le contexte professionnel de l'utilisateur.";
        
        return $prompt;
    }

    /**
     * Sauvegarder une conversation
     */
    protected function saveConversation(User $user, string $userMessage, string $aiResponse, array $context): void
    {
        try {
            $messages = [
                [
                    'role' => 'user',
                    'content' => $userMessage,
                    'timestamp' => now()->toISOString()
                ],
                [
                    'role' => 'assistant',
                    'content' => $aiResponse,
                    'timestamp' => now()->toISOString()
                ]
            ];

            AiConversation::create([
                'user_id' => $user->id,
                'client_id' => $context['client_id'] ?? null,
                'platform' => $context['platform'] ?? 'web',
                'session_id' => $context['session_id'] ?? Str::random(32),
                'messages' => $messages,
                'context' => $context,
                'last_activity_at' => now()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur sauvegarde conversation', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Obtenir les règles spécifiques à chaque plateforme
     */
    protected function getPlatformRules(string $platform): array
    {
        $rules = [
            'facebook' => [
                'description' => 'Posts engageants avec possibilité de texte long, bon pour storytelling',
                'max_chars' => 2000,
                'hashtags_count' => '2-3',
                'best_practices' => 'Questions, émotions, visuels'
            ],
            'instagram' => [
                'description' => 'Contenu visuel avec texte accrocheur, lifestyle et esthétique',
                'max_chars' => 2200,
                'hashtags_count' => '5-10',
                'best_practices' => 'Hashtags tendance, stories, visuels de qualité'
            ],
            'linkedin' => [
                'description' => 'Contenu professionnel, insights business, networking',
                'max_chars' => 3000,
                'hashtags_count' => '3-5',
                'best_practices' => 'Expertise, études de cas, conseils pro'
            ],
            'twitter' => [
                'description' => 'Messages courts, actualité, conversations rapides',
                'max_chars' => 280,
                'hashtags_count' => '1-2',
                'best_practices' => 'Trending topics, brevity, engagement'
            ]
        ];

        return $rules[$platform] ?? $rules['facebook'];
    }

    /**
     * Extraire les hashtags d'un contenu
     */
    protected function extractHashtags(string $content): array
    {
        preg_match_all('/#[\w\u00C0-\u017F]+/', $content, $matches);
        return $matches[0] ?? [];
    }

    /**
     * Générer du contenu pour flyer
     */
    public function generateFlyerContent(string $businessType, string $occasion, array $parameters = [], ?User $user = null): array
    {
        try {
            $prompt = "Crée le contenu textuel pour un flyer professionnel.\n\n";
            $prompt .= "Type d'entreprise : {$businessType}\n";
            $prompt .= "Occasion/Événement : {$occasion}\n";
            
            if (isset($parameters['target_audience'])) {
                $prompt .= "Audience cible : {$parameters['target_audience']}\n";
            }
            
            if (isset($parameters['promotion'])) {
                $prompt .= "Promotion : {$parameters['promotion']}\n";
            }
            
            $prompt .= "\nGénère :\n";
            $prompt .= "1. Un titre accrocheur (max 8 mots)\n";
            $prompt .= "2. Un sous-titre explicatif (max 15 mots)\n";
            $prompt .= "3. Un texte principal engageant (50-80 mots)\n";
            $prompt .= "4. Un call-to-action impactant (max 6 mots)\n";
            $prompt .= "5. Des informations de contact (placeholder)\n\n";
            $prompt .= "Formate en JSON avec les clés: titre, sous_titre, texte_principal, call_to_action, contact";

            $response = $this->openAIClient->chat()->create([
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert en création de flyers marketing et communication visuelle.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 800,
                'temperature' => 0.8
            ]);

            $content = $response->choices[0]->message->content ?? '';
            
            // Parser le JSON
            $flyerData = json_decode($content, true);
            
            if (!$flyerData) {
                throw new \Exception('Erreur parsing JSON du contenu flyer');
            }

            // Sauvegarder si utilisateur connecté
            if ($user) {
                GeneratedContent::create([
                    'user_id' => $user->id,
                    'type' => 'flyer_content',
                    'topic' => $occasion,
                    'content' => json_encode($flyerData),
                    'parameters' => array_merge($parameters, [
                        'business_type' => $businessType,
                        'occasion' => $occasion
                    ]),
                    'prompt_used' => $prompt,
                    'character_count' => strlen($content),
                    'word_count' => str_word_count($content)
                ]);
            }

            return [
                'success' => true,
                'flyer_content' => $flyerData,
                'business_type' => $businessType,
                'occasion' => $occasion
            ];

        } catch (\Exception $e) {
            Log::error('Erreur génération contenu flyer', [
                'business_type' => $businessType,
                'occasion' => $occasion,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de la génération du contenu flyer'
            ];
        }
    }

    /**
     * Analyser les performances marketing (avec IA)
     */
    public function analyzePerformance(array $data, ?User $user = null): array
    {
        try {
            $prompt = "Analyse les données de performance marketing suivantes et fournis des insights actionables.\n\n";
            $prompt .= "Données :\n";
            $prompt .= json_encode($data, JSON_PRETTY_PRINT);
            $prompt .= "\n\nFournis :\n";
            $prompt .= "1. Analyse des tendances principales\n";
            $prompt .= "2. Points forts identifiés\n";
            $prompt .= "3. Axes d'amélioration prioritaires\n";
            $prompt .= "4. Recommandations d'actions concrètes\n";
            $prompt .= "5. Prédictions pour les prochaines semaines\n\n";
            $prompt .= "Format : JSON avec les clés appropriées pour chaque section";

            $response = $this->openAIClient->chat()->create([
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert en analyse de données marketing et business intelligence.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 2000,
                'temperature' => 0.6
            ]);

            $analysisContent = $response->choices[0]->message->content ?? '';
            $analysis = json_decode($analysisContent, true);

            if (!$analysis) {
                throw new \Exception('Erreur parsing analyse performance');
            }

            // Sauvegarder l'analyse
            if ($user) {
                GeneratedContent::create([
                    'user_id' => $user->id,
                    'type' => 'performance_analysis',
                    'topic' => 'Analyse des performances marketing',
                    'content' => $analysisContent,
                    'parameters' => ['raw_data' => $data],
                    'prompt_used' => $prompt,
                    'character_count' => strlen($analysisContent),
                    'word_count' => str_word_count($analysisContent)
                ]);
            }

            return [
                'success' => true,
                'analysis' => $analysis,
                'data_points' => count($data),
                'generated_at' => now()->toISOString()
            ];

        } catch (\Exception $e) {
            Log::error('Erreur analyse performance IA', [
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de l\'analyse des performances'
            ];
        }
    }

    /**
     * Créer du contenu marketing optimisé en masse
     */
    public function generateBulkContent(string $contentType, array $topics, array $parameters = [], ?User $user = null): array
    {
        try {
            $results = [];
            $platform = $parameters['platform'] ?? 'facebook';
            $tone = $parameters['tone'] ?? 'professional';

            foreach ($topics as $index => $topic) {
                // Éviter de surcharger l'API
                if ($index > 0) {
                    sleep(1);
                }

                switch ($contentType) {
                    case 'social_post':
                        $result = $this->generateSocialPost($topic, $platform, $tone, $parameters, $user);
                        break;
                    case 'article':
                        $wordCount = $parameters['word_count'] ?? 800;
                        $keywords = $parameters['keywords'] ?? '';
                        $result = $this->generateArticle($topic, $keywords, $wordCount, $tone, $user);
                        break;
                    default:
                        $result = ['success' => false, 'error' => 'Type de contenu non supporté'];
                }

                $results[] = array_merge($result, ['topic' => $topic]);
            }

            $successCount = count(array_filter($results, fn($r) => $r['success'] === true));

            return [
                'success' => true,
                'results' => $results,
                'total_generated' => count($results),
                'successful' => $successCount,
                'failed' => count($results) - $successCount
            ];

        } catch (\Exception $e) {
            Log::error('Erreur génération contenu en masse', [
                'content_type' => $contentType,
                'topics_count' => count($topics),
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de la génération en masse'
            ];
        }
    }

    /**
     * Optimiser un contenu existant avec l'IA
     */
    public function optimizeContent(string $originalContent, string $objective, array $parameters = [], ?User $user = null): array
    {
        try {
            $prompt = "Optimise le contenu suivant pour améliorer sa performance.\n\n";
            $prompt .= "Contenu original :\n\"{$originalContent}\"\n\n";
            $prompt .= "Objectif d'optimisation : {$objective}\n";
            
            if (isset($parameters['platform'])) {
                $prompt .= "Plateforme cible : {$parameters['platform']}\n";
            }
            
            if (isset($parameters['audience'])) {
                $prompt .= "Audience : {$parameters['audience']}\n";
            }
            
            $prompt .= "\nAméliorations attendues :\n";
            $prompt .= "- Meilleur engagement\n";
            $prompt .= "- Clarté du message\n";
            $prompt .= "- Call-to-action plus efficace\n";
            $prompt .= "- Optimisation SEO si applicable\n\n";
            $prompt .= "Fournis le contenu optimisé et explique les améliorations apportées.";

            $response = $this->openAIClient->chat()->create([
                'model' => config('services.openai.model', 'gpt-4o-mini'),
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu es un expert en optimisation de contenu marketing et copywriting.'],
                    ['role' => 'user', 'content' => $prompt]
                ],
                'max_tokens' => 1500,
                'temperature' => 0.7
            ]);

            $optimizedContent = $response->choices[0]->message->content ?? '';

            if ($user) {
                GeneratedContent::create([
                    'user_id' => $user->id,
                    'type' => 'content_optimization',
                    'topic' => $objective,
                    'content' => $optimizedContent,
                    'parameters' => array_merge($parameters, [
                        'original_content' => $originalContent,
                        'objective' => $objective
                    ]),
                    'prompt_used' => $prompt,
                    'character_count' => strlen($optimizedContent),
                    'word_count' => str_word_count($optimizedContent)
                ]);
            }

            return [
                'success' => true,
                'original_content' => $originalContent,
                'optimized_content' => $optimizedContent,
                'objective' => $objective,
                'improvement_ratio' => strlen($optimizedContent) / strlen($originalContent)
            ];

        } catch (\Exception $e) {
            Log::error('Erreur optimisation contenu', [
                'objective' => $objective,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de l\'optimisation du contenu'
            ];
        }
    }
}
