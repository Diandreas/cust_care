<?php

namespace App\Services;

use App\Models\Client;
use App\Models\User;
use Carbon\Carbon;

class MessageTemplateService
{
    /**
     * Remplacer les variables dynamiques dans un message
     *
     * @param string $template Le template avec variables
     * @param Client $client Le client destinataire
     * @param User $user L'utilisateur expéditeur
     * @return string Le message avec variables remplacées
     */
    public function processTemplate(string $template, Client $client, User $user): string
    {
        $replacements = [
            // Variables client
            '{{client.name}}' => $client->name,
            '{{client.phone}}' => $client->phone,
            '{{client.email}}' => $client->email ?? '',
            '{{client.address}}' => $client->address ?? '',
            '{{client.birthday}}' => $client->birthday ? $client->birthday->format('d/m/Y') : '',
            '{{client.age}}' => $client->birthday ? $client->birthday->diffInYears(Carbon::now()) : '',
            
            // Variables utilisateur/entreprise
            '{{user.name}}' => $user->name,
            '{{user.business}}' => $user->business_name ?? $user->name,
            '{{user.email}}' => $user->email,
            
            // Variables date/heure
            '{{date}}' => Carbon::now()->format('d/m/Y'),
            '{{time}}' => Carbon::now()->format('H:i'),
            '{{year}}' => Carbon::now()->format('Y'),
            '{{month}}' => Carbon::now()->format('m'),
            '{{day}}' => Carbon::now()->format('d'),
        ];
        
        // Tags client si disponibles
        if ($client->tags && $client->tags->count() > 0) {
            $replacements['{{client.tags}}'] = $client->tags->pluck('name')->implode(', ');
        } else {
            $replacements['{{client.tags}}'] = '';
        }
        
        // Traiter les expressions conditionnelles
        $template = $this->processConditionals($template, $client, $user);
        
        // Remplacer toutes les variables
        return strtr($template, $replacements);
    }
    
    /**
     * Traiter les expressions conditionnelles
     * Format: {{if:condition}}contenu si vrai{{else}}contenu si faux{{endif}}
     */
    protected function processConditionals(string $template, Client $client, User $user): string
    {
        $pattern = '/{{if:(.*?)}}(.*?)(?:{{else}}(.*?))?{{endif}}/s';
        
        return preg_replace_callback($pattern, function($matches) use ($client, $user) {
            $condition = trim($matches[1]);
            $trueContent = $matches[2];
            $falseContent = $matches[3] ?? '';
            
            // Évaluer les conditions
            $result = $this->evaluateCondition($condition, $client, $user);
            
            return $result ? $trueContent : $falseContent;
        }, $template);
    }
    
    /**
     * Évaluer une condition simple
     */
    protected function evaluateCondition(string $condition, Client $client, User $user): bool
    {
        // Exemples de conditions supportées:
        // has_birthday, has_email, has_category, is_male, is_female, etc.
        
        switch ($condition) {
            case 'has_birthday':
                return $client->birthday !== null;
            case 'has_email':
                return !empty($client->email);
            case 'has_category':
                return true;
            case 'is_male':
                return $client->gender === 'male';
            case 'is_female':
                return $client->gender === 'female';
            case 'is_active':
                return $client->is_active;
            default:
                return false;
        }
    }
} 