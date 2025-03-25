<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    /**
     * Afficher la page d'abonnement de l'utilisateur
     */
    public function index()
    {
        $user = Auth::user();
        $subscription = $user->subscription;
        
        if ($subscription) {
            // Calcul des statistiques d'utilisation
            $smsUsagePercent = $subscription->sms_usage_percent;
            $campaignsUsagePercent = $subscription->campaigns_usage_percent;
            $smsQuotaLow = $subscription->sms_quota_low;
            $smsQuotaExhausted = $subscription->sms_quota_exhausted;
            
            // Charger le plan associé
            $subscription->load('plan');
        }
        
        return Inertia::render('Subscription/Index', [
            'subscription' => $subscription
        ]);
    }
    
    public function plans()
    {
        $currentSubscription = Auth::user()->subscription;
        
        $plans = [
            [
                'id' => 1,
                'code' => 'starter',
                'name' => 'Pack Starter',
                'price' => 5000,
                'annual_price' => 48000,
                'annual_discount_percent' => 20,
                'has_annual_option' => true,
                'max_clients' => 100,
                'max_campaigns_per_month' => 2,
                'total_campaign_sms' => 200,
                'monthly_sms_quota' => 50,
                'unused_sms_rollover_percent' => 0,
                'description' => 'Idéal pour les petites entreprises et les indépendants',
                'features' => [
                    'Jusqu\'à 100 clients',
                    '2 campagnes par mois',
                    '200 SMS promotionnels',
                    '50 SMS personnalisés',
                    'Support par email',
                ],
                'is_active' => true
            ],
            [
                'id' => 2,
                'code' => 'business',
                'name' => 'Pack Business',
                'price' => 15000,
                'annual_price' => 144000,
                'annual_discount_percent' => 20,
                'has_annual_option' => true,
                'max_clients' => 500,
                'max_campaigns_per_month' => 4,
                'total_campaign_sms' => 1000,
                'monthly_sms_quota' => 200,
                'unused_sms_rollover_percent' => 0.1,
                'description' => 'Parfait pour les PME avec une clientèle plus importante',
                'features' => [
                    'Jusqu\'à 500 clients',
                    '4 campagnes par mois',
                    '1000 SMS promotionnels',
                    '200 SMS personnalisés',
                    'Support téléphonique',
                    'Rapports détaillés',
                    'Report de 10% des SMS',
                ],
                'is_active' => true
            ],
            [
                'id' => 3,
                'code' => 'enterprise',
                'name' => 'Pack Enterprise',
                'price' => 30000,
                'annual_price' => 288000,
                'annual_discount_percent' => 20,
                'has_annual_option' => true,
                'max_clients' => 2000,
                'max_campaigns_per_month' => 8,
                'total_campaign_sms' => 4000,
                'monthly_sms_quota' => 500,
                'unused_sms_rollover_percent' => 0.2,
                'description' => 'Solution complète pour les entreprises à fort volume',
                'features' => [
                    'Jusqu\'à 2000 clients',
                    '8 campagnes par mois',
                    '4000 SMS promotionnels',
                    '500 SMS personnalisés',
                    'Support prioritaire 24/7',
                    'Rapports avancés',
                    'API complète',
                    'Report de 20% des SMS',
                ],
                'is_active' => true
            ],
        ];
        
        return Inertia::render('Subscription/Plans', [
            'plans' => $plans,
            'currentPlanId' => $currentSubscription ? $currentSubscription->plan_id : null
        ]);
    }
    
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'plan' => 'required|in:starter,business,enterprise',
            'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer',
            'duration' => 'required|string|in:monthly,annual',
        ]);
        
        $plan = $validated['plan'];
        
        // Définition des limites en fonction du plan
        $planLimits = [
            'starter' => [
                'clients_limit' => 100,
                'campaigns_limit' => 2,
                'sms_allowed' => 200,
                'personal_sms_limit' => 50,
                'price' => 5000,
                'annual_price' => 48000,
            ],
            'business' => [
                'clients_limit' => 500,
                'campaigns_limit' => 4,
                'sms_allowed' => 1000,
                'personal_sms_limit' => 200,
                'price' => 15000,
                'annual_price' => 144000,
            ],
            'enterprise' => [
                'clients_limit' => 2000,
                'campaigns_limit' => 8,
                'sms_allowed' => 4000,
                'personal_sms_limit' => 500,
                'price' => 30000,
                'annual_price' => 288000,
            ],
        ];
        
        $user = Auth::user();
        $existingSubscription = $user->subscription;
        
        // Déterminer si c'est un abonnement mensuel ou annuel
        $price = $validated['duration'] === 'annual' ? $planLimits[$plan]['annual_price'] : $planLimits[$plan]['price'];
        $expiresAt = $validated['duration'] === 'annual' ? now()->addYear() : now()->addMonth();
        
        if ($existingSubscription) {
            // Mettre à jour l'abonnement existant
            $existingSubscription->update([
                'plan' => $plan,
                'expires_at' => $expiresAt,
                'sms_allowed' => $planLimits[$plan]['sms_allowed'],
                'clients_limit' => $planLimits[$plan]['clients_limit'],
                'campaigns_limit' => $planLimits[$plan]['campaigns_limit'],
                'personal_sms_quota' => $planLimits[$plan]['personal_sms_limit'],
                'sms_used' => 0, // Réinitialiser l'utilisation
                'status' => 'active',
            ]);
        } else {
            // Créer un nouvel abonnement
            Subscription::create([
                'user_id' => Auth::id(),
                'plan' => $plan,
                'plan_id' => array_search($plan, ['starter', 'business', 'enterprise']) + 1, // Transforme starter -> 1, business -> 2, etc.
                'starts_at' => now(),
                'expires_at' => $expiresAt,
                'sms_allowed' => $planLimits[$plan]['sms_allowed'],
                'sms_used' => 0,
                'clients_limit' => $planLimits[$plan]['clients_limit'],
                'campaigns_limit' => $planLimits[$plan]['campaigns_limit'],
                'personal_sms_quota' => $planLimits[$plan]['personal_sms_limit'],
                'status' => 'active',
                'duration' => $validated['duration'],
                'is_auto_renew' => true,
            ]);
        }
        
        return redirect()->route('subscription.index')->with('success', 'Abonnement souscrit avec succès.');
    }
    
    public function topup(Request $request)
    {
        $validated = $request->validate([
            'sms_amount' => 'required|integer|min:100|max:5000',
        ]);
        
        $subscription = Auth::user()->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->back()->with('error', 'Vous devez avoir un abonnement actif pour acheter des SMS supplémentaires.');
        }
        
        // Ajouter les SMS à l'abonnement actuel
        $subscription->personal_sms_quota += $validated['sms_amount'];
        $subscription->save();
        
        return redirect()->back()->with('success', 'SMS supplémentaires ajoutés avec succès.');
    }
    
    /**
     * Afficher les addons disponibles
     */
    public function addons()
    {
        $subscription = Auth::user()->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->route('subscription.plans')
                ->with('error', 'Vous devez avoir un abonnement actif pour acheter des options complémentaires.');
        }
        
        $smsAddons = [
            [
                'id' => 'sms_100',
                'name' => '100 SMS supplémentaires',
                'description' => 'Idéal pour les petites campagnes',
                'price' => 1000,
                'quantity' => 1,
                'unit' => 'lot de 100 SMS'
            ],
            [
                'id' => 'sms_500',
                'name' => '500 SMS supplémentaires',
                'description' => 'Bon rapport qualité/prix',
                'price' => 4500,
                'quantity' => 5,
                'unit' => 'lots de 100 SMS'
            ],
            [
                'id' => 'sms_1000',
                'name' => '1000 SMS supplémentaires',
                'description' => 'Économique pour des volumes importants',
                'price' => 8000,
                'quantity' => 10,
                'unit' => 'lots de 100 SMS'
            ]
        ];
        
        $clientsAddons = [
            [
                'id' => 'clients_100',
                'name' => '+100 clients',
                'description' => 'Étendez votre base de données clients',
                'price' => 2000,
                'quantity' => 1,
                'unit' => 'lot de 100 clients'
            ],
            [
                'id' => 'clients_500',
                'name' => '+500 clients',
                'description' => 'Idéal pour les entreprises en croissance',
                'price' => 8000,
                'quantity' => 5,
                'unit' => 'lots de 100 clients'
            ]
        ];
        
        return Inertia::render('Subscription/Addons', [
            'subscription' => $subscription,
            'smsAddons' => $smsAddons,
            'clientsAddons' => $clientsAddons
        ]);
    }
    
    /**
     * Affiche l'historique des factures
     */
    public function invoices()
    {
        $user = Auth::user();
        
        // En mode test, nous allons simuler quelques factures
        $invoices = [
            [
                'id' => 'INV-001',
                'date' => now()->subDays(30)->format('Y-m-d'),
                'amount' => 5000,
                'status' => 'paid',
                'description' => 'Abonnement Pack Starter - 1 mois'
            ],
            [
                'id' => 'INV-002',
                'date' => now()->subDays(15)->format('Y-m-d'),
                'amount' => 1000,
                'status' => 'paid',
                'description' => 'Achat de 100 SMS supplémentaires'
            ]
        ];
        
        return Inertia::render('Subscription/Invoices', [
            'invoices' => $invoices
        ]);
    }
}