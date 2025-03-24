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
            'starter' => [
                'name' => 'Pack Starter',
                'price' => 5000,
                'clients_limit' => 100,
                'campaigns_limit' => 2,
                'sms_allowed' => 200,
                'personal_sms_limit' => 50,
                'rollover' => 0,
            ],
            'business' => [
                'name' => 'Pack Business',
                'price' => 15000,
                'clients_limit' => 500,
                'campaigns_limit' => 4,
                'sms_allowed' => 1000,
                'personal_sms_limit' => 200,
                'rollover' => 10,
            ],
            'enterprise' => [
                'name' => 'Pack Enterprise',
                'price' => 30000,
                'clients_limit' => 2000,
                'campaigns_limit' => 8,
                'sms_allowed' => 4000,
                'personal_sms_limit' => 500,
                'rollover' => 20,
            ],
        ];
        
        return Inertia::render('Subscription/Plans', [
            'plans' => $plans,
            'currentSubscription' => $currentSubscription
        ]);
    }
    
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'plan' => 'required|in:starter,business,enterprise'
        ]);
        
        $plan = $validated['plan'];
        
        // Définition des limites en fonction du plan
        $planLimits = [
            'starter' => [
                'clients_limit' => 100,
                'campaigns_limit' => 2,
                'sms_allowed' => 200,
                'personal_sms_limit' => 50,
            ],
            'business' => [
                'clients_limit' => 500,
                'campaigns_limit' => 4,
                'sms_allowed' => 1000,
                'personal_sms_limit' => 200,
            ],
            'enterprise' => [
                'clients_limit' => 2000,
                'campaigns_limit' => 8,
                'sms_allowed' => 4000,
                'personal_sms_limit' => 500,
            ],
        ];
        
        // Créer un nouvel abonnement
        Subscription::create([
            'user_id' => Auth::id(),
            'plan' => $plan,
            'starts_at' => now(),
            'expires_at' => now()->addMonth(),
            'sms_allowed' => $planLimits[$plan]['sms_allowed'],
            'sms_used' => 0,
            'clients_limit' => $planLimits[$plan]['clients_limit'],
            'campaigns_limit' => $planLimits[$plan]['campaigns_limit'],
            'personal_sms_limit' => $planLimits[$plan]['personal_sms_limit'],
            'status' => 'active',
        ]);
        
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
        $subscription->sms_allowed += $validated['sms_amount'];
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