<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Twilio Webhook Routes
    |--------------------------------------------------------------------------
    |
    | Ce fichier définit les routes utilisées par les webhooks Twilio.
    | Ces routes sont utilisées dans le fichier de routes et dans le contrôleur.
    |
    */

    'sms' => [
        'webhook' => 'twilio.webhook.sms',
    ],
    
    'whatsapp' => [
        'webhook' => 'twilio.webhook.whatsapp',
    ],
    
    'voice' => [
        'webhook' => 'twilio.webhook.voice',
        'menu' => 'twilio.voice.menu',
        'agent' => 'twilio.voice.agent',
        'recording' => 'twilio.voice.recording',
        'transcription' => 'twilio.voice.transcription',
        'outbound' => 'twilio.voice.outbound',
        'outbound_action' => 'twilio.voice.outbound.action',
    ],
    
    'settings' => [
        'update_general' => 'settings.general.update',
        'update_twilio' => 'settings.twilio.update',
        'update_ai' => 'settings.ai.update',
        'purchase_number' => 'settings.phone.purchase',
        'release_number' => 'settings.phone.release',
    ],
]; 