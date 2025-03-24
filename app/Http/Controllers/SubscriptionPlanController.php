<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionPlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $plans = SubscriptionPlan::where('is_active', true)->get();
        
        return Inertia::render('Subscription/Plans', [
            'plans' => $plans,
        ]);
    }

    /**
     * Display the specified subscription plan.
     */
    public function show(SubscriptionPlan $plan)
    {
        return Inertia::render('Subscription/PlanDetails', [
            'plan' => $plan,
        ]);
    }

    /**
     * Process subscription plan selection
     */
    public function subscribe(Request $request, SubscriptionPlan $plan)
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer',
            'duration' => 'required|string|in:monthly,annual',
        ]);
        
        // Vérifier si le plan a une option annuelle
        if ($validated['duration'] === 'annual' && !$plan->has_annual_option) {
            return redirect()->back()->with('error', 'Ce plan ne propose pas d\'option d\'abonnement annuel.');
        }
        
        // Rediriger vers la page de confirmation de paiement
        return redirect()->route('payment.confirmation', [
            'plan_id' => $plan->id,
            'payment_method' => $validated['payment_method'],
            'duration' => $validated['duration'],
        ]);
    }

    /**
     * Purchase additional resources (SMS, client capacity)
     */
    public function purchaseAddons(Request $request)
    {
        $validated = $request->validate([
            'addon_type' => 'required|in:sms,clients',
            'quantity' => 'required|integer|min:1',
            'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer',
        ]);
        
        $user = $request->user();
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->back()->with('error', 'Vous devez avoir un abonnement actif pour acheter des options complémentaires.');
        }
        
        // Rediriger vers la page de confirmation de paiement
        return redirect()->route('payment.confirmation', [
            'addon_type' => $validated['addon_type'],
            'quantity' => $validated['quantity'],
            'payment_method' => $validated['payment_method'],
        ]);
    }
}
