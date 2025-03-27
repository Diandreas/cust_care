<?php

namespace App\Services\Sms;

use App\Services\Sms\Providers\TwilioSmsProvider;
use Illuminate\Support\Facades\Log;

class SmsProviderFactory
{
    /**
     * Créer une instance du fournisseur SMS approprié
     *
     * @param string|null $provider Identifiant du fournisseur à utiliser
     * @return SmsProviderInterface Instance du fournisseur SMS
     * @throws \InvalidArgumentException Si le fournisseur n'est pas pris en charge
     */
    public function create(string $provider = null): SmsProviderInterface
    {
        $provider = $provider ?? config('sms.default_provider', 'twilio');
        
        switch ($provider) {
            case 'twilio':
                return new TwilioSmsProvider(
                    config('services.twilio.account_sid'),
                    config('services.twilio.auth_token'),
                    config('services.twilio.from_number')
                );
                
            // À compléter avec d'autres fournisseurs
            // case 'africas_talking':
            //     return new AfricasTalkingSmsProvider(
            //         config('services.africas_talking.api_key')
            //     );
                
            default:
                Log::error("Fournisseur SMS non supporté: $provider");
                throw new \InvalidArgumentException("Fournisseur SMS '$provider' non supporté");
        }
    }
} 