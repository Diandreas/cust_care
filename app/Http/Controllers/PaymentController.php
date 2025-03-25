<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Traiter un paiement pour une souscription
     */
    public function processSubscriptionPayment(Request $request, SubscriptionPlan $plan)
    {
        // Capturer toutes les données reçues pour débogage
        Log::debug('Données reçues pour activation abonnement', [
            'all_request_data' => $request->all(),
            'headers' => $request->headers->all(),
        ]);
        
        $validated = $request->validate([
            'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer',
            'duration' => 'required|string|in:monthly,annual',
            'simulation_mode' => 'nullable|boolean',
        ]);
        
        $duration = $validated['duration'];
        $amount = $duration === 'annual' ? $plan->annual_price : $plan->price;
        $simulationMode = $validated['simulation_mode'] ?? false;
        
        // En mode simulation/test, on active directement l'abonnement sans vérifier le paiement
        Log::info('Activation directe de l\'abonnement en mode simulation', [
            'user_id' => Auth::id(),
            'plan_id' => $plan->id,
            'amount' => $amount,
            'payment_method' => $validated['payment_method'],
            'duration' => $duration,
            'simulation_mode' => $simulationMode,
        ]);
        
        try {
            // Activer l'abonnement directement
            $result = $this->handleSuccessfulPayment($plan, $duration);
            Log::info('Résultat de l\'activation', ['result' => 'success']);
            return $result;
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'activation de l\'abonnement', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Une erreur est survenue lors de l\'activation de votre abonnement: ' . $e->getMessage());
        }
    }
    
    /**
     * Traiter un paiement pour des options complémentaires (addons)
     */
    public function processAddonPayment(Request $request)
    {
        // Capturer toutes les données reçues pour débogage
        Log::debug('Données reçues pour activation d\'options', [
            'all_request_data' => $request->all(),
            'headers' => $request->headers->all(),
        ]);
        
        $request->validate([
            'addon_type' => 'required|in:sms,clients',
            'quantity' => 'required|integer|min:1|max:100',
            'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer',
            'simulation_mode' => 'nullable|boolean',
        ]);
        
        $addonType = $request->addon_type;
        $quantity = $request->quantity;
        $amount = 0;
        $simulationMode = $request->simulation_mode ?? false;
        
        // Calculer le montant à payer
        if ($addonType === 'sms') {
            // 1000 FCFA pour 100 SMS
            $amount = $quantity * 1000;
        } else if ($addonType === 'clients') {
            // 2000 FCFA pour 100 clients
            $amount = $quantity * 2000;
        }
        
        // En mode simulation/test, on active directement l'option sans vérifier le paiement
        Log::info('Activation directe de l\'option complémentaire en mode simulation', [
            'user_id' => Auth::id(),
            'addon_type' => $addonType,
            'quantity' => $quantity,
            'amount' => $amount,
            'payment_method' => $request->payment_method,
            'simulation_mode' => $simulationMode,
        ]);
        
        try {
            // Activer l'option directement
            $result = $this->handleSuccessfulAddonPayment($addonType, $quantity);
            Log::info('Résultat de l\'activation de l\'addon', ['result' => 'success']);
            return $result;
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'activation de l\'option', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Une erreur est survenue lors de l\'activation de votre option: ' . $e->getMessage());
        }
    }
    
    /**
     * Gérer un paiement d'abonnement réussi
     */
    private function handleSuccessfulPayment(SubscriptionPlan $plan, string $duration = 'monthly')
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect()->route('login');
        }
        
        $existingSubscription = $user->subscription;
        
        // Déterminer la date d'expiration en fonction de la durée
        $expiresAt = $duration === 'annual' ? now()->addYear() : now()->addMonth();
        
        if ($existingSubscription && $existingSubscription->status === 'active') {
            // Mettre à jour l'abonnement existant
            $existingSubscription->update([
                'plan_id' => $plan->id,
                'plan' => $plan->name,
                'duration' => $duration,
                'clients_limit' => $plan->max_clients,
                'campaigns_limit' => $plan->max_campaigns_per_month,
                'campaign_sms_limit' => $plan->total_campaign_sms,
                'personal_sms_quota' => $plan->monthly_sms_quota,
                'expires_at' => $expiresAt,
                'next_renewal_date' => $expiresAt,
            ]);
            
            $durationType = $duration === 'annual' ? 'annuel' : 'mensuel';
            return redirect()->route('subscription.index')->with('success', "Votre abonnement $durationType a été mis à jour avec succès!");
        } else {
            // Créer un nouvel abonnement
            $subscription = new Subscription();
            $subscription->user_id = $user->id;
            $subscription->plan_id = $plan->id;
            $subscription->plan = $plan->name;
            $subscription->status = 'active';
            $subscription->duration = $duration;
            $subscription->starts_at = now();
            $subscription->expires_at = $expiresAt;
            $subscription->clients_limit = $plan->max_clients;
            $subscription->campaigns_limit = $plan->max_campaigns_per_month;
            $subscription->campaign_sms_limit = $plan->total_campaign_sms;
            $subscription->personal_sms_quota = $plan->monthly_sms_quota;
            $subscription->sms_used = 0;
            $subscription->campaigns_used = 0;
            $subscription->next_renewal_date = $expiresAt;
            $subscription->is_auto_renew = true;
            $subscription->save();
            
            $durationType = $duration === 'annual' ? 'annuel' : 'mensuel';
            return redirect()->route('subscription.index')->with('success', "Votre abonnement $durationType a été activé avec succès!");
        }
    }
    
    /**
     * Gérer un paiement d'option complémentaire réussi
     */
    private function handleSuccessfulAddonPayment(string $addonType, int $quantity)
    {
        $user = Auth::user();
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->back()->with('error', 'Vous devez avoir un abonnement actif pour acheter des options complémentaires.');
        }
        
        if ($addonType === 'sms') {
            // 100 SMS supplémentaires pour 1000 FCFA
            $smsToAdd = $quantity * 100;
            $subscription->personal_sms_quota += $smsToAdd;
            $subscription->save();
            
            return redirect()->route('subscription.index')->with('success', "$smsToAdd SMS ont été ajoutés à votre quota avec succès!");
        } else if ($addonType === 'clients') {
            // 100 clients supplémentaires pour 2000 FCFA
            $clientsToAdd = $quantity * 100;
            $subscription->clients_limit += $clientsToAdd;
            $subscription->save();
            
            return redirect()->route('subscription.index')->with('success', "Capacité augmentée de $clientsToAdd clients supplémentaires!");
        }
        
        return redirect()->route('subscription.index')->with('error', 'Option non reconnue.');
    }
    
    /**
     * Page de confirmation de paiement
     */
    public function showPaymentConfirmation(Request $request)
    {
        $data = $request->validate([
            'plan_id' => 'nullable|exists:subscription_plans,id',
            'addon_type' => 'nullable|in:sms,clients',
            'quantity' => 'nullable|integer|min:1',
            'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer',
            'duration' => 'nullable|string|in:monthly,annual',
        ]);
        
        $plan = null;
        $addonType = null;
        $quantity = null;
        $amount = 0;
        $duration = $data['duration'] ?? 'monthly';
        
        if (isset($data['plan_id'])) {
            $plan = SubscriptionPlan::find($data['plan_id']);
            $amount = $duration === 'annual' ? $plan->annual_price : $plan->price;
        } else if (isset($data['addon_type'])) {
            $addonType = $data['addon_type'];
            $quantity = $data['quantity'];
            
            if ($addonType === 'sms') {
                $amount = $quantity * 1000; // 1000 FCFA pour 100 SMS
            } else if ($addonType === 'clients') {
                $amount = $quantity * 2000; // 2000 FCFA pour 100 clients
            }
        }
        
        return Inertia::render('Payment/Confirmation', [
            'plan' => $plan,
            'addonType' => $addonType,
            'quantity' => $quantity,
            'amount' => $amount,
            'paymentMethod' => $data['payment_method'],
            'duration' => $duration,
        ]);
    }
    
    /**
     * Activer directement un abonnement en mode simulation
     */
    public function directActivation(SubscriptionPlan $plan, string $duration = 'monthly')
    {
        if (!in_array($duration, ['monthly', 'annual'])) {
            $duration = 'monthly';
        }
        
        Log::info('Activation directe de l\'abonnement via URL spéciale', [
            'user_id' => Auth::id(),
            'plan_id' => $plan->id,
            'duration' => $duration,
        ]);
        
        try {
            // Activer l'abonnement directement
            $result = $this->handleSuccessfulPayment($plan, $duration);
            Log::info('Résultat de l\'activation directe', ['result' => 'success']);
            return $result;
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'activation directe de l\'abonnement', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->route('subscription.plans')->with('error', 'Une erreur est survenue lors de l\'activation de votre abonnement: ' . $e->getMessage());
        }
    }
}
