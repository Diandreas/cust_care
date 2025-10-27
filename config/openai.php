<?php

return [

    /*
    |--------------------------------------------------------------------------
    | OpenAI API Key and Organization
    |--------------------------------------------------------------------------
    |
    | Here you may specify your OpenAI API Key and organization. This will be
    | used to authenticate with the OpenAI API - you can find your API key
    | on your OpenAI dashboard, at https://platform.openai.com/account/api-keys.
    |
    */

    'api_key' => env('OPENAI_API_KEY'),
    'organization' => env('OPENAI_ORGANIZATION'),

    /*
    |--------------------------------------------------------------------------
    | OpenAI API Request Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure the OpenAI API requests. You may configure
    | the timeout, max retries, and other request configurations.
    |
    */

    'request' => [
        'timeout' => env('OPENAI_REQUEST_TIMEOUT', 30),
        'max_retries' => env('OPENAI_MAX_RETRIES', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | OpenAI Default Model Settings
    |--------------------------------------------------------------------------
    |
    | Here you may configure the default model settings that will be used
    | throughout your application when no specific model is provided.
    |
    */

    'defaults' => [
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'max_tokens' => env('OPENAI_MAX_TOKENS', 2000),
        'temperature' => env('OPENAI_TEMPERATURE', 0.7),
        'top_p' => env('OPENAI_TOP_P', 1),
        'frequency_penalty' => env('OPENAI_FREQUENCY_PENALTY', 0),
        'presence_penalty' => env('OPENAI_PRESENCE_PENALTY', 0),
    ],

    /*
    |--------------------------------------------------------------------------
    | Marketing Assistant Specific Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration spécifique pour l'assistant marketing digital
    |
    */

    'marketing' => [
        'enabled' => env('AI_CONTENT_GENERATION_ENABLED', true),
        'chat_model' => env('OPENAI_CHAT_MODEL', 'gpt-4o-mini'),
        'completion_model' => env('OPENAI_COMPLETION_MODEL', 'gpt-4o-mini'),
        'max_tokens_chat' => env('OPENAI_MAX_TOKENS', 2000),
        'max_tokens_content' => env('OPENAI_MAX_TOKENS', 2000),
        'temperature_creative' => 0.8,
        'temperature_professional' => 0.5,
        'cache_enabled' => env('AI_CACHE_ENABLED', true),
        'cache_ttl' => env('AI_CACHE_TTL_MINUTES', 60),
        'whatsapp_max_chars' => env('AI_RESPONSE_MAX_CHARS_WHATSAPP', 4000),
    ],

    /*
    |--------------------------------------------------------------------------
    | Content Generation Prompts
    |--------------------------------------------------------------------------
    |
    | Templates de prompts pour la génération de contenu
    |
    */

    'prompts' => [
        'system_marketing' => 'Tu es un expert en marketing digital spécialisé dans la création de contenu engageant pour les entreprises. Tu maîtrises parfaitement le français et tu connais les meilleures pratiques marketing.',
        
        'social_post' => 'Crée un post engageant pour {platform} sur le sujet : "{topic}". Ton : {tone}. Inclus des hashtags pertinents et respecte les contraintes de la plateforme.',
        
        'flyer_content' => 'Génère le contenu textuel pour un flyer professionnel sur le thème : "{topic}". Format : {format}. Inclus : titre accrocheur, sous-titre, description principale, call-to-action.',
        
        'personalized_message' => 'Personnalise ce message pour le client {client_name} : "{template}". Utilise les informations disponibles : {client_data}.',
        
        'whatsapp_response' => 'Réponds en tant qu\'assistant marketing professionnel à ce message WhatsApp : "{message}". Sois utile, concis et professionnel. Limite à {max_chars} caractères.',
    ],

    /*
    |--------------------------------------------------------------------------
    | Platform Specific Settings
    |--------------------------------------------------------------------------
    |
    | Paramètres spécifiques pour chaque plateforme sociale
    |
    */

    'platforms' => [
        'facebook' => [
            'max_chars' => 2000,
            'hashtags_count' => 5,
            'description' => 'Posts longs acceptés, ton conversationnel',
        ],
        
        'instagram' => [
            'max_chars' => 300,
            'hashtags_count' => 10,
            'description' => 'Contenu visuel, hashtags importants',
        ],
        
        'twitter' => [
            'max_chars' => 280,
            'hashtags_count' => 2,
            'description' => 'Concis, impactant, tendances',
        ],
        
        'linkedin' => [
            'max_chars' => 3000,
            'hashtags_count' => 3,
            'description' => 'Professionnel, valeur ajoutée, networking',
        ],
        
        'whatsapp' => [
            'max_chars' => 4000,
            'hashtags_count' => 0,
            'description' => 'Conversationnel, direct, personnel',
        ],
    ],

];