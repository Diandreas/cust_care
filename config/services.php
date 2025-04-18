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
        'token' => env('TWILIO_AUTH_TOKEN'),
        'number' => env('TWILIO_NUMBER'),
        'whatsapp_number' => env('TWILIO_WHATSAPP_NUMBER'),
    ],
    
    'sendgrid' => [
        'key' => env('SENDGRID_API_KEY'),
    ],

];
