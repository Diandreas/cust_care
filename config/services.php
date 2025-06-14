<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],
    'sms' => [
        'api_key' => env('SMS_API_KEY', ''),
        'api_url' => env('SMS_API_URL', 'https://api.yoursmsservice.com/v1/send'),
    ],
    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'notchpay' => [
        'public_key' => env('NOTCHPAY_PUBLIC_KEY'),
        'secret_key' => env('NOTCHPAY_SECRET_KEY'),
        'webhook_secret' => env('NOTCHPAY_WEBHOOK_SECRET'),
        'sandbox' => env('NOTCHPAY_SANDBOX', true),
    ],

    'paypal' => [
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),
        'mode' => env('PAYPAL_MODE', 'sandbox'),
    ],

    'twilio' => [
        'sid' => env('TWILIO_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        'from_number' => env('TWILIO_FROM'),
        'webhook_secret' => env('TWILIO_WEBHOOK_SECRET'),

        // Configuration des quotas par abonnement
        'quotas' => [
            'starter' => [
                'sms_per_month' => 200,
                'number_type' => 'shared'
            ],
            'business' => [
                'sms_per_month' => 1000,
                'number_type' => 'dedicated'
            ],
            'enterprise' => [
                'sms_per_month' => 4000,
                'number_type' => 'unlimited'
            ]
        ],

        // Heures autorisées pour envoi (conformité France)
        'allowed_hours' => [
            'start' => '00:00',
            'end' => '23:00',
            'pause_start' => '13:00',
            'pause_end' => '14:00'
        ]
    ],

    'sendgrid' => [
        'api_key' => env('SENDGRID_API_KEY'),
        'from_email' => env('SENDGRID_FROM_EMAIL', 'contact@helloboost.fr'),
        'from_name' => env('SENDGRID_FROM_NAME', 'HelloBoost'),
    ],

    'ai' => [
        'enabled' => env('AI_ENABLED', false),
        'api_key' => env('AI_API_KEY'),
        'endpoint' => env('AI_ENDPOINT'),
        'model' => env('AI_MODEL', 'gpt-3.5-turbo'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => 'http://localhost:8000/auth/google/callback',
    ],

];
