<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\TwilioController;
use App\Models\User;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Affiche la page des paramètres
     */
    public function index()
    {
        $user = Auth::user();
        
        // Récupérer la configuration Twilio de l'utilisateur
        $twilioConfig = $this->getTwilioConfig($user);
        
        // Récupérer les informations d'abonnement
        $subscription = $this->getSubscriptionDetails($user);
        
        return Inertia::render('Settings/Index', [
            'user' => $user,
            'twilioConfig' => $twilioConfig,
            'subscription' => $subscription,
        ]);
    }
    
    /**
     * Met à jour les paramètres généraux
     */
    public function updateGeneral(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'timezone' => 'required|string|max:255',
            'language' => 'required|string|max:10',
            'notifications_enabled' => 'boolean',
        ]);
        
        $user = Auth::user();
        $user->update($validated);
        
        return redirect()->back()->with('success', 'Paramètres généraux mis à jour avec succès.');
    }
    
    /**
     * Met à jour les paramètres Twilio
     */
    public function updateTwilio(Request $request)
    {
        $validated = $request->validate([
            'account_sid' => 'required|string|max:255',
            'auth_token' => 'nullable|string|max:255',
            'sms_enabled' => 'boolean',
            'whatsapp_enabled' => 'boolean',
            'voice_enabled' => 'boolean',
            'email_enabled' => 'boolean',
        ]);
        
        $user = Auth::user();
        
        // Mettre à jour les paramètres Twilio
        $userSettings = $user->settings ?? [];
        $userSettings['twilio'] = [
            'account_sid' => $validated['account_sid'],
            'sms_enabled' => $validated['sms_enabled'],
            'whatsapp_enabled' => $validated['whatsapp_enabled'],
            'voice_enabled' => $validated['voice_enabled'],
            'email_enabled' => $validated['email_enabled'],
        ];
        
        // Mettre à jour le token seulement s'il est fourni
        if (!empty($validated['auth_token'])) {
            $userSettings['twilio']['auth_token'] = encrypt($validated['auth_token']);
        }
        
        $user->settings = $userSettings;
        $user->save();
        
        return redirect()->back()->with('success', 'Configuration Twilio mise à jour avec succès.');
    }
    
    /**
     * Met à jour les paramètres d'IA
     */
    public function updateAI(Request $request)
    {
        $validated = $request->validate([
            'ai_enabled' => 'boolean',
            'auto_response' => 'boolean',
            'sentiment_analysis' => 'boolean',
            'smart_routing' => 'boolean',
            'campaign_optimization' => 'boolean',
        ]);
        
        $user = Auth::user();
        
        // Mettre à jour les paramètres d'IA
        $userSettings = $user->settings ?? [];
        $userSettings['ai'] = $validated;
        
        $user->settings = $userSettings;
        $user->save();
        
        return redirect()->back()->with('success', 'Paramètres IA mis à jour avec succès.');
    }
    
    /**
     * Achète un nouveau numéro de téléphone
     */
    public function purchasePhoneNumber(Request $request)
    {
        $validated = $request->validate([
            'phone_number' => 'required|string|max:20',
            'capabilities' => 'required|array',
        ]);
        
        $user = Auth::user();
        
        // Vérifier l'abonnement et le quota de numéros
        $subscription = $this->getSubscriptionDetails($user);
        
        if ($subscription['phone_numbers_used'] >= $subscription['phone_numbers_included']) {
            return redirect()->back()->with('error', 'Vous avez atteint votre quota de numéros de téléphone. Veuillez mettre à niveau votre abonnement.');
        }
        
        // Instancier le contrôleur Twilio
        $twilioController = new TwilioController();
        
        // Utiliser les identifiants de l'utilisateur
        $twilioSettings = $user->settings['twilio'] ?? [];
        $twilioController->setCredentials(
            $twilioSettings['account_sid'] ?? null,
            isset($twilioSettings['auth_token']) ? decrypt($twilioSettings['auth_token']) : null
        );
        
        // Acheter le numéro
        $result = $twilioController->purchasePhoneNumber(
            'FR',
            null,
            $validated['capabilities']
        );
        
        if (!$result['success']) {
            return redirect()->back()->with('error', 'Erreur lors de l\'achat du numéro: ' . $result['error']);
        }
        
        // Enregistrer le numéro dans les paramètres de l'utilisateur
        $userSettings = $user->settings ?? [];
        $userSettings['phone_numbers'] = $userSettings['phone_numbers'] ?? [];
        $userSettings['phone_numbers'][] = [
            'phone_number' => $result['phone_number'],
            'sid' => $result['sid'],
            'capabilities' => $result['capabilities'],
            'date_created' => now()->toDateTimeString(),
            'type' => 'dedicated',
            'monthly_cost' => 2.00, // Coût mensuel en euros
        ];
        
        $user->settings = $userSettings;
        $user->save();
        
        return redirect()->back()->with('success', 'Numéro de téléphone acheté avec succès.');
    }
    
    /**
     * Libère un numéro de téléphone
     */
    public function releasePhoneNumber(Request $request, $sid)
    {
        $user = Auth::user();
        
        // Vérifier si le numéro appartient à l'utilisateur
        $userSettings = $user->settings ?? [];
        $phoneNumbers = $userSettings['phone_numbers'] ?? [];
        
        $phoneNumberIndex = -1;
        foreach ($phoneNumbers as $index => $phoneNumber) {
            if ($phoneNumber['sid'] === $sid) {
                $phoneNumberIndex = $index;
                break;
            }
        }
        
        if ($phoneNumberIndex === -1) {
            return redirect()->back()->with('error', 'Numéro de téléphone non trouvé.');
        }
        
        // Instancier le contrôleur Twilio
        $twilioController = new TwilioController();
        
        // Utiliser les identifiants de l'utilisateur
        $twilioSettings = $user->settings['twilio'] ?? [];
        $twilioController->setCredentials(
            $twilioSettings['account_sid'] ?? null,
            isset($twilioSettings['auth_token']) ? decrypt($twilioSettings['auth_token']) : null
        );
        
        // Libérer le numéro
        $result = $twilioController->releasePhoneNumber($sid);
        
        if (!$result['success']) {
            return redirect()->back()->with('error', 'Erreur lors de la libération du numéro: ' . $result['error']);
        }
        
        // Supprimer le numéro des paramètres de l'utilisateur
        unset($phoneNumbers[$phoneNumberIndex]);
        $userSettings['phone_numbers'] = array_values($phoneNumbers);
        
        $user->settings = $userSettings;
        $user->save();
        
        return redirect()->back()->with('success', 'Numéro de téléphone libéré avec succès.');
    }
    
    /**
     * Récupère la configuration Twilio de l'utilisateur
     */
    private function getTwilioConfig(User $user)
    {
        $twilioSettings = $user->settings['twilio'] ?? [];
        $phoneNumbers = $user->settings['phone_numbers'] ?? [];
        
        // Si l'utilisateur a un abonnement de base, ajouter le numéro partagé
        $subscription = $this->getSubscriptionDetails($user);
        if ($subscription['plan'] === 'basic' && empty($phoneNumbers)) {
            $phoneNumbers[] = [
                'phone_number' => config('services.twilio.default_sms_number'),
                'type' => 'shared',
                'monthly_cost' => 0,
            ];
        }
        
        // Récupérer les numéros disponibles si l'utilisateur n'a pas un abonnement de base
        $availableNumbers = [];
        if ($subscription['plan'] !== 'basic') {
            // Instancier le contrôleur Twilio
            $twilioController = new TwilioController();
            
            // Utiliser les identifiants de l'utilisateur
            $twilioController->setCredentials(
                $twilioSettings['account_sid'] ?? null,
                isset($twilioSettings['auth_token']) ? decrypt($twilioSettings['auth_token']) : null
            );
            
            // Récupérer les numéros disponibles
            $result = $twilioController->getAvailablePhoneNumbers();
            
            if ($result['success']) {
                $availableNumbers = array_map(function($number) {
                    return [
                        'phone_number' => $number['phone_number'],
                        'friendly_name' => $number['friendly_name'],
                        'monthly_cost' => 2.00, // Coût mensuel en euros
                    ];
                }, $result['numbers']);
            }
        }
        
        return [
            'account_sid' => $twilioSettings['account_sid'] ?? null,
            'sms_enabled' => $twilioSettings['sms_enabled'] ?? false,
            'whatsapp_enabled' => $twilioSettings['whatsapp_enabled'] ?? false,
            'voice_enabled' => $twilioSettings['voice_enabled'] ?? false,
            'email_enabled' => $twilioSettings['email_enabled'] ?? false,
            'ai_enabled' => $user->settings['ai']['ai_enabled'] ?? false,
            'phone_numbers' => $phoneNumbers,
            'available_numbers' => $availableNumbers,
        ];
    }
    
    /**
     * Récupère les détails de l'abonnement de l'utilisateur
     */
    private function getSubscriptionDetails(User $user)
    {
        // À implémenter selon le système d'abonnement
        // Exemple de base pour démonstration
        $plan = $user->subscription_plan ?? 'basic';
        
        $features = [];
        $phoneNumbersIncluded = 0;
        $canRequestNumbers = false;
        
        switch ($plan) {
            case 'premium':
                $features = ['unlimited_sms', 'unlimited_numbers', 'full_ai', '24_7_support'];
                $phoneNumbersIncluded = 999; // Illimité en pratique
                $canRequestNumbers = true;
                break;
                
            case 'pro':
                $features = ['5000_sms', 'dedicated_number', 'advanced_ai', 'priority_support'];
                $phoneNumbersIncluded = 1;
                $canRequestNumbers = false;
                break;
                
            case 'basic':
            default:
                $features = ['1000_sms', 'shared_number', 'basic_support'];
                $phoneNumbersIncluded = 0;
                $canRequestNumbers = false;
                break;
        }
        
        // Compter le nombre de numéros utilisés
        $phoneNumbersUsed = count($user->settings['phone_numbers'] ?? []);
        
        return [
            'plan' => $plan,
            'features' => $features,
            'phone_numbers_included' => $phoneNumbersIncluded,
            'phone_numbers_used' => $phoneNumbersUsed,
            'can_request_numbers' => $canRequestNumbers,
        ];
    }
}
