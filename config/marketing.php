<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Configuration Marketing Digital
    |--------------------------------------------------------------------------
    |
    | Ce fichier contient la configuration pour toutes les fonctionnalités
    | du marketing digital : WhatsApp, IA, automatisations, etc.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Configuration WhatsApp Business
    |--------------------------------------------------------------------------
    */
    'whatsapp' => [
        'enabled' => env('WHATSAPP_ENABLED', true),
        'provider' => env('WHATSAPP_PROVIDER', 'twilio'),
        'webhook_url' => env('WHATSAPP_WEBHOOK_URL', '/webhooks/whatsapp'),
        'rate_limit' => [
            'messages_per_minute' => env('WHATSAPP_RATE_LIMIT_PER_MINUTE', 30),
            'messages_per_hour' => env('WHATSAPP_RATE_LIMIT_PER_HOUR', 1000),
            'messages_per_day' => env('WHATSAPP_RATE_LIMIT_PER_DAY', 10000),
        ],
        'anti_spam' => [
            'delay_between_messages' => env('WHATSAPP_ANTI_SPAM_DELAY', 1), // secondes
            'max_messages_per_client_per_day' => env('WHATSAPP_MAX_MESSAGES_PER_CLIENT_PER_DAY', 5),
        ],
        'opt_out' => [
            'keywords' => ['STOP', 'ARRET', 'OPT-OUT', 'UNSUBSCRIBE', 'DESABONNER'],
            'confirmation_message' => 'Vous avez été désabonné des communications WhatsApp. Pour vous réabonner, contactez-nous.',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration Intelligence Artificielle
    |--------------------------------------------------------------------------
    */
    'ai' => [
        'enabled' => env('AI_ENABLED', true),
        'provider' => env('AI_PROVIDER', 'openai'),
        'default_model' => env('AI_DEFAULT_MODEL', 'gpt-4'),
        'max_tokens' => env('AI_MAX_TOKENS', 2000),
        'temperature' => env('AI_TEMPERATURE', 0.7),
        'cache_enabled' => env('AI_CACHE_ENABLED', true),
        'cache_ttl' => env('AI_CACHE_TTL', 3600), // 1 heure
        'rate_limit' => [
            'requests_per_minute' => env('AI_RATE_LIMIT_PER_MINUTE', 60),
            'requests_per_hour' => env('AI_RATE_LIMIT_PER_HOUR', 1000),
        ],
        'content_generation' => [
            'max_articles_per_day' => env('AI_MAX_ARTICLES_PER_DAY', 10),
            'max_posts_per_day' => env('AI_MAX_POSTS_PER_DAY', 20),
            'max_flyer_content_per_day' => env('AI_MAX_FLYER_CONTENT_PER_DAY', 5),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration des Automatisations
    |--------------------------------------------------------------------------
    */
    'automation' => [
        'enabled' => env('AUTOMATION_ENABLED', true),
        'execution_frequency' => env('AUTOMATION_EXECUTION_FREQUENCY', 'hourly'),
        'max_rules_per_user' => env('AUTOMATION_MAX_RULES_PER_USER', 100),
        'max_executions_per_rule_per_day' => env('AUTOMATION_MAX_EXECUTIONS_PER_RULE_PER_DAY', 1000),
        'birthday' => [
            'enabled' => env('AUTOMATION_BIRTHDAY_ENABLED', true),
            'default_days_ahead' => env('AUTOMATION_BIRTHDAY_DAYS_AHEAD', 0),
            'max_messages_per_day' => env('AUTOMATION_BIRTHDAY_MAX_MESSAGES_PER_DAY', 100),
        ],
        'seasonal' => [
            'enabled' => env('AUTOMATION_SEASONAL_ENABLED', true),
            'default_dates' => [
                '01-01' => 'Nouvel An',
                '02-14' => 'Saint-Valentin',
                '05-12' => 'Fête des Mères',
                '06-16' => 'Fête des Pères',
                '09-01' => 'Rentrée',
                '10-31' => 'Halloween',
                '12-25' => 'Noël',
                '12-31' => 'Saint-Sylvestre',
            ],
        ],
        'new_client' => [
            'enabled' => env('AUTOMATION_NEW_CLIENT_ENABLED', true),
            'default_hours_threshold' => env('AUTOMATION_NEW_CLIENT_HOURS_THRESHOLD', 24),
        ],
        'inactive_client' => [
            'enabled' => env('AUTOMATION_INACTIVE_CLIENT_ENABLED', true),
            'default_days_threshold' => env('AUTOMATION_INACTIVE_CLIENT_DAYS_THRESHOLD', 30),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration des Campagnes
    |--------------------------------------------------------------------------
    */
    'campaigns' => [
        'enabled' => env('CAMPAIGNS_ENABLED', true),
        'max_campaigns_per_user' => env('CAMPAIGNS_MAX_PER_USER', 1000),
        'max_clients_per_campaign' => env('CAMPAIGNS_MAX_CLIENTS_PER_CAMPAIGN', 10000),
        'scheduling' => [
            'min_advance_notice' => env('CAMPAIGNS_MIN_ADVANCE_NOTICE', 15), // minutes
            'max_future_scheduling' => env('CAMPAIGNS_MAX_FUTURE_SCHEDULING', 365), // jours
        ],
        'types' => [
            'whatsapp' => [
                'enabled' => true,
                'max_message_length' => 1000,
                'supports_media' => true,
            ],
            'email' => [
                'enabled' => env('CAMPAIGNS_EMAIL_ENABLED', false),
                'max_subject_length' => 100,
                'max_body_length' => 10000,
            ],
            'social_media' => [
                'enabled' => env('CAMPAIGNS_SOCIAL_ENABLED', false),
                'platforms' => ['facebook', 'instagram', 'twitter', 'linkedin'],
            ],
            'flyer' => [
                'enabled' => true,
                'max_file_size' => 10 * 1024 * 1024, // 10MB
                'supported_formats' => ['png', 'jpg', 'jpeg', 'pdf'],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration des Flyers
    |--------------------------------------------------------------------------
    */
    'flyers' => [
        'enabled' => env('FLYERS_ENABLED', true),
        'max_flyers_per_user' => env('FLYERS_MAX_PER_USER', 500),
        'formats' => [
            'a4' => [
                'width' => 210,
                'height' => 297,
                'unit' => 'mm',
                'orientation' => ['portrait', 'landscape'],
            ],
            'a5' => [
                'width' => 148,
                'height' => 210,
                'unit' => 'mm',
                'orientation' => ['portrait', 'landscape'],
            ],
            'square' => [
                'width' => 1080,
                'height' => 1080,
                'unit' => 'px',
                'orientation' => ['portrait'],
            ],
            'story' => [
                'width' => 1080,
                'height' => 1920,
                'unit' => 'px',
                'orientation' => ['portrait'],
            ],
            'post' => [
                'width' => 1200,
                'height' => 630,
                'unit' => 'px',
                'orientation' => ['landscape'],
            ],
        ],
        'export' => [
            'default_format' => 'png',
            'default_quality' => 'high',
            'default_resolution' => 300,
            'max_file_size' => 50 * 1024 * 1024, // 50MB
        ],
        'templates' => [
            'business' => [
                'name' => 'Business',
                'description' => 'Template professionnel pour entreprises',
                'colors' => ['#2c3e50', '#3498db', '#ecf0f1'],
                'fonts' => ['Arial', 'Helvetica'],
            ],
            'creative' => [
                'name' => 'Créatif',
                'description' => 'Template coloré et moderne',
                'colors' => ['#e74c3c', '#f39c12', '#27ae60'],
                'fonts' => ['Comic Sans MS', 'Arial'],
            ],
            'minimal' => [
                'name' => 'Minimaliste',
                'description' => 'Design épuré et élégant',
                'colors' => ['#000000', '#ffffff', '#cccccc'],
                'fonts' => ['Arial', 'Times New Roman'],
            ],
            'elegant' => [
                'name' => 'Élégant',
                'description' => 'Style sophistiqué et raffiné',
                'colors' => ['#8b4513', '#d2691e', '#f4a460'],
                'fonts' => ['Georgia', 'Times New Roman'],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration des Templates de Contenu
    |--------------------------------------------------------------------------
    */
    'templates' => [
        'enabled' => env('TEMPLATES_ENABLED', true),
        'max_templates_per_user' => env('TEMPLATES_MAX_PER_USER', 100),
        'types' => [
            'post' => [
                'name' => 'Post Réseaux Sociaux',
                'max_length' => 500,
                'supports_hashtags' => true,
                'supports_media' => true,
            ],
            'article' => [
                'name' => 'Article de Blog',
                'min_length' => 300,
                'max_length' => 5000,
                'supports_seo' => true,
            ],
            'message' => [
                'name' => 'Message WhatsApp/Email',
                'max_length' => 1000,
                'supports_personalization' => true,
            ],
            'flyer' => [
                'name' => 'Flyer',
                'supports_ai_generation' => true,
                'supports_templates' => true,
            ],
            'email' => [
                'name' => 'Email Marketing',
                'max_subject_length' => 100,
                'max_body_length' => 10000,
                'supports_html' => true,
            ],
        ],
        'tones' => [
            'professional' => 'Professionnel',
            'casual' => 'Décontracté',
            'friendly' => 'Amical',
            'formal' => 'Formel',
            'creative' => 'Créatif',
        ],
        'platforms' => [
            'facebook' => 'Facebook',
            'instagram' => 'Instagram',
            'twitter' => 'Twitter/X',
            'linkedin' => 'LinkedIn',
            'whatsapp' => 'WhatsApp',
            'email' => 'Email',
            'flyer' => 'Flyer',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration des Limites et Quotas
    |--------------------------------------------------------------------------
    */
    'limits' => [
        'free_plan' => [
            'max_clients' => 100,
            'max_campaigns' => 10,
            'max_automations' => 5,
            'max_flyers' => 20,
            'max_templates' => 10,
            'monthly_messages' => 1000,
            'ai_generations_per_month' => 50,
        ],
        'pro_plan' => [
            'max_clients' => 10000,
            'max_campaigns' => 1000,
            'max_automations' => 100,
            'max_flyers' => 500,
            'max_templates' => 100,
            'monthly_messages' => 100000,
            'ai_generations_per_month' => 1000,
        ],
        'enterprise_plan' => [
            'max_clients' => 100000,
            'max_campaigns' => 10000,
            'max_automations' => 1000,
            'max_flyers' => 5000,
            'max_templates' => 1000,
            'monthly_messages' => 1000000,
            'ai_generations_per_month' => 10000,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration des Notifications
    |--------------------------------------------------------------------------
    */
    'notifications' => [
        'enabled' => env('MARKETING_NOTIFICATIONS_ENABLED', true),
        'channels' => [
            'email' => env('MARKETING_NOTIFICATIONS_EMAIL', true),
            'database' => env('MARKETING_NOTIFICATIONS_DATABASE', true),
            'slack' => env('MARKETING_NOTIFICATIONS_SLACK', false),
        ],
        'events' => [
            'campaign_started' => true,
            'campaign_completed' => true,
            'automation_triggered' => true,
            'client_opted_out' => true,
            'message_failed' => true,
            'quota_exceeded' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration de la Sécurité et Conformité
    |--------------------------------------------------------------------------
    */
    'security' => [
        'gdpr_compliance' => env('MARKETING_GDPR_COMPLIANCE', true),
        'data_retention' => [
            'clients' => env('MARKETING_DATA_RETENTION_CLIENTS', 2555), // 7 ans
            'messages' => env('MARKETING_DATA_RETENTION_MESSAGES', 1095), // 3 ans
            'campaigns' => env('MARKETING_DATA_RETENTION_CAMPAIGNS', 1825), // 5 ans
            'logs' => env('MARKETING_DATA_RETENTION_LOGS', 365), // 1 an
        ],
        'encryption' => [
            'sensitive_data' => env('MARKETING_ENCRYPT_SENSITIVE_DATA', true),
            'phone_numbers' => env('MARKETING_ENCRYPT_PHONE_NUMBERS', true),
            'personal_info' => env('MARKETING_ENCRYPT_PERSONAL_INFO', true),
        ],
        'audit_logging' => [
            'enabled' => env('MARKETING_AUDIT_LOGGING', true),
            'log_level' => env('MARKETING_AUDIT_LOG_LEVEL', 'info'),
            'retention_days' => env('MARKETING_AUDIT_LOG_RETENTION', 1095), // 3 ans
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration des Webhooks
    |--------------------------------------------------------------------------
    */
    'webhooks' => [
        'enabled' => env('MARKETING_WEBHOOKS_ENABLED', true),
        'endpoints' => [
            'whatsapp_status' => '/webhooks/whatsapp/status',
            'whatsapp_incoming' => '/webhooks/whatsapp/incoming',
            'campaign_completed' => '/webhooks/campaigns/completed',
            'automation_triggered' => '/webhooks/automations/triggered',
        ],
        'security' => [
            'signature_verification' => env('MARKETING_WEBHOOK_SIGNATURE_VERIFICATION', true),
            'rate_limiting' => env('MARKETING_WEBHOOK_RATE_LIMITING', true),
            'max_retries' => env('MARKETING_WEBHOOK_MAX_RETRIES', 3),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Configuration des Rapports et Analytics
    |--------------------------------------------------------------------------
    */
    'analytics' => [
        'enabled' => env('MARKETING_ANALYTICS_ENABLED', true),
        'tracking' => [
            'message_opens' => true,
            'link_clicks' => true,
            'conversions' => true,
            'client_behavior' => true,
        ],
        'reports' => [
            'daily' => true,
            'weekly' => true,
            'monthly' => true,
            'custom_period' => true,
        ],
        'export_formats' => ['csv', 'xlsx', 'pdf', 'json'],
    ],
];