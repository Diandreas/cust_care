<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\Log;

class SafeSmsContent implements Rule
{
    protected $failReason;

    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        // 1. Vérifier la longueur
        if (mb_strlen($value) > 1000) {
            $this->failReason = 'longueur_excessive';
            return false;
        }
        
        // 2. Vérifier les liens malveillants
        $blacklistedDomains = config('sms.blacklisted_domains', [
            'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', // Raccourcisseurs d'URL
            'scam.com', 'malware.com', 'phishing.com' // Exemples fictifs
        ]);
        
        foreach ($blacklistedDomains as $domain) {
            if (stripos($value, $domain) !== false) {
                $this->failReason = 'domaine_blackliste';
                Log::warning('Tentative d\'envoi SMS avec domaine interdit', [
                    'domain' => $domain,
                    'content_sample' => substr($value, 0, 50)
                ]);
                return false;
            }
        }
        
        // 3. Vérifier les caractères interdits
        $forbiddenPatterns = [
            '/\b(?:viagra|cialis)\b/i', // Mots interdits
            '/\$\d+[km]?\s+(?:income|earning)/i', // Promesses financières
            '/buy cheap|discount price/i', // Spam
            '/\+\d{1,3}\s*\d{9,12}/', // Numéros de téléphone suspects
            '/(?:password|mot de passe|carte bancaire)/i' // Contenus sensibles
        ];
        
        foreach ($forbiddenPatterns as $pattern) {
            if (preg_match($pattern, $value)) {
                $this->failReason = 'contenu_interdit';
                Log::warning('Tentative d\'envoi SMS avec contenu interdit', [
                    'pattern' => $pattern,
                    'content_sample' => substr($value, 0, 50)
                ]);
                return false;
            }
        }
        
        return true;
    }

    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        $messages = [
            'longueur_excessive' => 'Le contenu du message est trop long (maximum 1000 caractères).',
            'domaine_blackliste' => 'Le message contient un lien vers un domaine non autorisé.',
            'contenu_interdit' => 'Le contenu du message contient des éléments interdits.'
        ];
        
        return $messages[$this->failReason] ?? 'Le contenu du message n\'est pas valide.';
    }
} 