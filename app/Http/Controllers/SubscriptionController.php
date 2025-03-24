<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function index()
    {
        $subscription = Auth::user()->subscription;
        
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
} 