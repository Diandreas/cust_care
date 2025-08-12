<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\MarketingContentTemplate;

class AIContentService
{
    protected $defaultModel;
    protected $maxTokens;
    protected $temperature;

    public function __construct()
    {
        $this->defaultModel = config('services.openai.model', 'gpt-4');
        $this->maxTokens = config('services.openai.max_tokens', 2000);
        $this->temperature = config('services.openai.temperature', 0.7);
    }

    /**
     * Générer une réponse de chat IA
     */
    public function generateChatResponse(string $message, array $context = []): array
    {
        try {
            $systemPrompt = $this->buildSystemPrompt($context);
            
            $response = OpenAI::chat()->create([
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $message],
                ],
                'max_tokens' => $this->maxTokens,
                'temperature' => $this->temperature,
            ]);

            $content = $response->choices[0]->message->content;

            return [
                'success' => true,
                'content' => $content,
                'usage' => $response->usage,
                'model' => $this->defaultModel,
            ];

        } catch (\Exception $e) {
            Log::error('AI chat response generation failed', [
                'message' => $message,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'fallback' => $this->getFallbackResponse($message),
            ];
        }
    }

    /**
     * Générer du contenu marketing
     */
    public function generateMarketingContent(string $type, array $parameters): array
    {
        try {
            $prompt = $this->buildMarketingPrompt($type, $parameters);
            
            $response = OpenAI::chat()->create([
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'system', 'content' => $this->getMarketingSystemPrompt()],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => $this->maxTokens,
                'temperature' => $this->temperature,
            ]);

            $content = $response->choices[0]->message->content;
            $parsedContent = $this->parseMarketingContent($content, $type);

            return [
                'success' => true,
                'content' => $parsedContent,
                'raw_content' => $content,
                'usage' => $response->usage,
                'type' => $type,
            ];

        } catch (\Exception $e) {
            Log::error('AI marketing content generation failed', [
                'type' => $type,
                'parameters' => $parameters,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'fallback' => $this->getMarketingFallback($type, $parameters),
            ];
        }
    }

    /**
     * Générer un article de blog
     */
    public function generateArticle(string $topic, string $keywords, int $wordCount, string $tone = 'professional'): array
    {
        $parameters = [
            'topic' => $topic,
            'keywords' => $keywords,
            'word_count' => $wordCount,
            'tone' => $tone,
            'type' => 'article',
        ];

        return $this->generateMarketingContent('article', $parameters);
    }

    /**
     * Générer un post pour réseaux sociaux
     */
    public function generateSocialMediaPost(string $topic, array $platforms, string $tone = 'casual'): array
    {
        $parameters = [
            'topic' => $topic,
            'platforms' => $platforms,
            'tone' => $tone,
            'type' => 'post',
        ];

        return $this->generateMarketingContent('post', $parameters);
    }

    /**
     * Générer un message WhatsApp personnalisé
     */
    public function generatePersonalizedMessage(string $baseMessage, array $context = []): string
    {
        try {
            $prompt = "Personnalisez ce message WhatsApp en gardant le même sens mais en l'adaptant au contexte :\n\n";
            $prompt .= "Message de base : {$baseMessage}\n\n";
            
            if (!empty($context)) {
                $prompt .= "Contexte : " . json_encode($context, JSON_UNESCAPED_UNICODE) . "\n\n";
            }
            
            $prompt .= "Générez une version personnalisée et engageante.";

            $response = OpenAI::chat()->create([
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'system', 'content' => 'Vous êtes un expert en communication WhatsApp qui personnalise les messages pour les rendre plus engageants et personnels.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => 500,
                'temperature' => 0.8,
            ]);

            return $response->choices[0]->message->content;

        } catch (\Exception $e) {
            Log::error('AI personalized message generation failed', [
                'base_message' => $baseMessage,
                'error' => $e->getMessage(),
            ]);

            return $baseMessage; // Retourner le message original en cas d'erreur
        }
    }

    /**
     * Générer du contenu pour flyer
     */
    public function generateFlyerContent(string $topic, string $format, array $requirements = []): array
    {
        $parameters = [
            'topic' => $topic,
            'format' => $format,
            'requirements' => $requirements,
            'type' => 'flyer',
        ];

        return $this->generateMarketingContent('flyer', $parameters);
    }

    /**
     * Générer des suggestions de contenu
     */
    public function generateContentSuggestions(string $topic, array $constraints = []): array
    {
        try {
            $prompt = "Générez 5 suggestions de contenu marketing pour le sujet : {$topic}\n\n";
            
            if (!empty($constraints)) {
                $prompt .= "Contraintes : " . json_encode($constraints, JSON_UNESCAPED_UNICODE) . "\n\n";
            }
            
            $prompt .= "Format de réponse :\n";
            $prompt .= "1. [Titre] - [Description courte]\n";
            $prompt .= "2. [Titre] - [Description courte]\n";
            $prompt .= "...";

            $response = OpenAI::chat()->create([
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'system', 'content' => 'Vous êtes un expert en marketing digital qui génère des suggestions de contenu créatives et pertinentes.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => 800,
                'temperature' => 0.9,
            ]);

            $content = $response->choices[0]->message->content;
            $suggestions = $this->parseSuggestions($content);

            return [
                'success' => true,
                'suggestions' => $suggestions,
                'raw_content' => $content,
            ];

        } catch (\Exception $e) {
            Log::error('AI content suggestions generation failed', [
                'topic' => $topic,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'suggestions' => $this->getDefaultSuggestions($topic),
            ];
        }
    }

    /**
     * Optimiser du contenu existant
     */
    public function optimizeContent(string $content, string $platform, string $goal): array
    {
        try {
            $prompt = "Optimisez ce contenu pour {$platform} avec l'objectif de {$goal} :\n\n";
            $prompt .= "Contenu original :\n{$content}\n\n";
            $prompt .= "Générez une version optimisée qui respecte les bonnes pratiques de {$platform}.";

            $response = OpenAI::chat()->create([
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'system', 'content' => "Vous êtes un expert en optimisation de contenu pour {$platform}."],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => $this->maxTokens,
                'temperature' => 0.7,
            ]);

            $optimizedContent = $response->choices[0]->message->content;

            return [
                'success' => true,
                'original' => $content,
                'optimized' => $optimizedContent,
                'platform' => $platform,
                'goal' => $goal,
            ];

        } catch (\Exception $e) {
            Log::error('AI content optimization failed', [
                'platform' => $platform,
                'goal' => $goal,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'original' => $content,
            ];
        }
    }

    /**
     * Construire le prompt système
     */
    protected function buildSystemPrompt(array $context = []): string
    {
        $basePrompt = "Vous êtes un assistant marketing digital expert qui aide les entreprises à créer du contenu engageant et efficace. ";
        $basePrompt .= "Vous connaissez les meilleures pratiques du marketing digital, la psychologie du consommateur, et les tendances actuelles. ";
        $basePrompt .= "Vos réponses sont toujours pratiques, actionnables et adaptées au contexte français.";

        if (!empty($context)) {
            $basePrompt .= "\n\nContexte spécifique : " . json_encode($context, JSON_UNESCAPED_UNICODE);
        }

        return $basePrompt;
    }

    /**
     * Construire le prompt marketing
     */
    protected function buildMarketingPrompt(string $type, array $parameters): string
    {
        $prompts = [
            'post' => "Générez un post engageant pour {$parameters['platforms'][0]} sur le sujet : {$parameters['topic']}\n\n",
            'article' => "Générez un article de blog de {$parameters['word_count']} mots sur : {$parameters['topic']}\n\n",
            'flyer' => "Générez le contenu pour un flyer {$parameters['format']} sur : {$parameters['topic']}\n\n",
            'message' => "Générez un message WhatsApp engageant sur : {$parameters['topic']}\n\n",
        ];

        $prompt = $prompts[$type] ?? "Générez du contenu marketing sur : {$parameters['topic']}\n\n";

        if (isset($parameters['tone'])) {
            $prompt .= "Ton : {$parameters['tone']}\n";
        }

        if (isset($parameters['keywords'])) {
            $prompt .= "Mots-clés à inclure : {$parameters['keywords']}\n";
        }

        if (isset($parameters['requirements'])) {
            $prompt .= "Exigences spécifiques : " . json_encode($parameters['requirements'], JSON_UNESCAPED_UNICODE) . "\n";
        }

        $prompt .= "\nFormat de réponse : JSON structuré avec tous les éléments nécessaires.";

        return $prompt;
    }

    /**
     * Obtenir le prompt système marketing
     */
    protected function getMarketingSystemPrompt(): string
    {
        return "Vous êtes un expert en marketing digital qui génère du contenu de haute qualité. ";
        return .= "Vous connaissez parfaitement les bonnes pratiques pour chaque plateforme et type de contenu. ";
        return .= "Vos réponses sont toujours au format JSON structuré et prêtes à l'utilisation. ";
        return .= "Vous respectez les contraintes de longueur et de ton spécifiées.";
    }

    /**
     * Parser le contenu marketing
     */
    protected function parseMarketingContent(string $content, string $type): array
    {
        try {
            // Essayer de parser le JSON
            $parsed = json_decode($content, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $parsed;
            }

            // Si ce n'est pas du JSON valide, essayer de l'extraire
            return $this->extractContentFromText($content, $type);

        } catch (\Exception $e) {
            Log::warning('Failed to parse AI marketing content', [
                'content' => $content,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);

            return $this->extractContentFromText($content, $type);
        }
    }

    /**
     * Extraire le contenu du texte
     */
    protected function extractContentFromText(string $text, string $type): array
    {
        $lines = explode("\n", $text);
        $content = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            if (str_contains($line, ':')) {
                [$key, $value] = explode(':', $line, 2);
                $key = strtolower(trim($key));
                $value = trim($value);
                
                if (!empty($value)) {
                    $content[$key] = $value;
                }
            } else {
                // Ligne sans séparateur, probablement du contenu
                if (!isset($content['content'])) {
                    $content['content'] = '';
                }
                $content['content'] .= $line . "\n";
            }
        }

        return $content;
    }

    /**
     * Parser les suggestions
     */
    protected function parseSuggestions(string $content): array
    {
        $lines = explode("\n", $content);
        $suggestions = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || !preg_match('/^\d+\./', $line)) continue;

            $suggestion = preg_replace('/^\d+\.\s*/', '', $line);
            if (!empty($suggestion)) {
                $suggestions[] = $suggestion;
            }
        }

        return $suggestions;
    }

    /**
     * Obtenir une réponse de secours
     */
    protected function getFallbackResponse(string $message): string
    {
        $fallbacks = [
            'Je suis désolé, je rencontre des difficultés techniques. Pouvez-vous reformuler votre question ?',
            'Je ne peux pas traiter votre demande pour le moment. Essayez dans quelques instants.',
            'Une erreur technique s\'est produite. Contactez le support si le problème persiste.',
        ];

        return $fallbacks[array_rand($fallbacks)];
    }

    /**
     * Obtenir un contenu marketing de secours
     */
    protected function getMarketingFallback(string $type, array $parameters): array
    {
        $fallbacks = [
            'post' => [
                'title' => 'Contenu en cours de génération...',
                'body' => 'Veuillez patienter pendant que nous créons votre contenu.',
                'hashtags' => ['#marketing', '#contenu'],
            ],
            'article' => [
                'title' => 'Article en cours de rédaction...',
                'introduction' => 'Introduction en cours...',
                'body' => 'Contenu en cours de génération...',
                'conclusion' => 'Conclusion en cours...',
            ],
            'flyer' => [
                'headline' => 'Titre principal',
                'subheadline' => 'Sous-titre',
                'body_text' => 'Contenu principal du flyer',
                'call_to_action' => 'Agir maintenant',
            ],
        ];

        return $fallbacks[$type] ?? ['error' => 'Type de contenu non supporté'];
    }

    /**
     * Obtenir des suggestions par défaut
     */
    protected function getDefaultSuggestions(string $topic): array
    {
        return [
            "Guide complet sur {$topic}",
            "5 conseils essentiels pour {$topic}",
            "Comment optimiser votre {$topic}",
            "Les tendances actuelles de {$topic}",
            "Cas d'usage pratiques de {$topic}",
        ];
    }

    /**
     * Mettre en cache une réponse IA
     */
    public function cacheResponse(string $key, array $response, int $ttl = 3600): void
    {
        Cache::put("ai_response_{$key}", $response, $ttl);
    }

    /**
     * Récupérer une réponse IA du cache
     */
    public function getCachedResponse(string $key): ?array
    {
        return Cache::get("ai_response_{$key}");
    }

    /**
     * Vérifier la configuration OpenAI
     */
    public function testConnection(): array
    {
        try {
            $response = OpenAI::chat()->create([
                'model' => $this->defaultModel,
                'messages' => [
                    ['role' => 'user', 'content' => 'Test de connexion'],
                ],
                'max_tokens' => 10,
            ]);

            return [
                'success' => true,
                'model' => $this->defaultModel,
                'response_time' => microtime(true),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'model' => $this->defaultModel,
            ];
        }
    }
}