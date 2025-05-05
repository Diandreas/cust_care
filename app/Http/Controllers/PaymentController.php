<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\Plan;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Traiter un paiement pour une souscription
     */

    /**
     * Traite le paiement d'un abonnement
     */
    public function processSubscriptionPayment(Request $request, $planId)
    {
        // For GET requests, redirect to plans page
        if ($request->isMethod('get')) {
            return redirect()->route('subscription.plans');
        }

        // Validation
        $validated = $request->validate([
            'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer,notchpay,paypal',
            'duration' => 'required|string|in:monthly,annual',
            'simulation_mode' => 'nullable|boolean'
        ]);

        $plan = Plan::findOrFail($planId);
        $user = Auth::user();

        // Calculer le prix
        $price = $validated['duration'] === 'annual' ? $plan->annual_price : $plan->price;

        // Pour le mode de test/simulation
        if ($request->simulation_mode) {
            // Créer directement la souscription sans passer par le paiement
            return $this->finalizeSubscription($user->id, $plan, $validated['duration'], $price, $validated['payment_method']);
        }

        // Rediriger vers la page de confirmation
        return Inertia::render('Payment/Confirmation', [
            'plan' => $plan,
            'addonType' => null,
            'quantity' => null,
            'amount' => $price,
            'paymentMethod' => $validated['payment_method'],
            'duration' => $validated['duration'],
        ]);
    }

    /**
     * Traite le paiement d'un addon (SMS ou limite clients)
     */
    public function processAddonPayment(Request $request)
    {
        // For GET requests, redirect to dashboard
        if ($request->isMethod('get')) {
            return redirect()->route('subscription.dashboard');
        }

        // Logique similaire pour les addons
    }

    /**
     * Finalise la souscription après un paiement réussi
     */
    private function finalizeSubscription($userId, $plan, $duration, $amount, $paymentMethod)
    {
        $user = User::findOrFail($userId);
        $expiresAt = $duration === 'annual' ? now()->addYear() : now()->addMonth();

        Log::info('Début de la finalisation de l\'abonnement', [
            'user_id' => $userId,
            'plan_id' => $plan->id,
            'plan_name' => $plan->name,
            'duration' => $duration,
            'amount' => $amount,
            'payment_method' => $paymentMethod
        ]);

        DB::beginTransaction();
        try {
            $existingSubscription = $user->subscription;
            $description = '';
            $transactionType = '';

            if ($existingSubscription) {
                Log::info('Mise à jour d\'un abonnement existant', [
                    'subscription_id' => $existingSubscription->id
                ]);
                
                // Mettre à jour l'abonnement existant
                $existingSubscription->update([
                    'plan' => $plan->code,
                    'plan_id' => $plan->id,
                    'expires_at' => $expiresAt,
                    'sms_allowed' => $plan->total_campaign_sms,
                    'clients_limit' => $plan->max_clients,
                    'campaigns_limit' => $plan->max_campaigns_per_month,
                    'personal_sms_quota' => $plan->monthly_sms_quota,
                    'sms_used' => 0,
                    'campaigns_used' => 0,
                    'status' => 'active',
                    'duration' => $duration,
                    'is_auto_renew' => true,
                ]);

                $transactionType = 'addon';
                $description = 'Changement de plan d\'abonnement vers ' . ucfirst($plan->name);
                
                Log::info('Abonnement existant mis à jour avec succès', [
                    'subscription_id' => $existingSubscription->id
                ]);
            } else {
                Log::info('Création d\'un nouvel abonnement');
                
                // Créer un nouvel abonnement
                $subscription = Subscription::create([
                    'user_id' => $user->id,
                    'plan' => $plan->code,
                    'plan_id' => $plan->id,
                    'starts_at' => now(),
                    'expires_at' => $expiresAt,
                    'sms_allowed' => $plan->total_campaign_sms,
                    'sms_used' => 0,
                    'campaigns_used' => 0,
                    'clients_limit' => $plan->max_clients,
                    'campaigns_limit' => $plan->max_campaigns_per_month,
                    'personal_sms_quota' => $plan->monthly_sms_quota,
                    'status' => 'active',
                    'duration' => $duration,
                    'is_auto_renew' => true,
                ]);

                $transactionType = 'subscription';
                $description = 'Nouvel abonnement ' . ucfirst($plan->name) . ' (' . $duration . ')';
                
                Log::info('Nouvel abonnement créé avec succès', [
                    'subscription_id' => $subscription->id ?? 'Aucun ID retourné'
                ]);
            }

            // Créer une transaction
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'description' => $description,
                'amount' => $amount,
                'type' => $transactionType,
                'status' => 'completed',
                'payment_method' => $paymentMethod,
            ]);
            
            Log::info('Transaction créée avec succès', [
                'transaction_id' => $transaction->id ?? 'Aucun ID retourné'
            ]);

            DB::commit();
            Log::info('Finalisation de l\'abonnement terminée avec succès');

            return redirect()->route('subscription.dashboard')
                ->with('success', 'Abonnement souscrit avec succès.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la finalisation de l\'abonnement', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->back()->with('error', 'Une erreur est survenue: ' . $e->getMessage());
        }
    }
    /**
     * Gérer un paiement d'abonnement réussi
     */
    private function handleSuccessfulPayment(Plan $plan, string $duration = 'monthly')
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
                'sms_allowed' => $plan->total_campaign_sms,
                'personal_sms_quota' => $plan->monthly_sms_quota,
                'expires_at' => $expiresAt,
                'next_renewal_date' => $expiresAt,
            ]);

            $durationType = $duration === 'annual' ? 'annuel' : 'mensuel';
            return redirect()->route('subscription.dashboard')->with('success', "Votre abonnement $durationType a été mis à jour avec succès!");
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
            $subscription->sms_allowed = $plan->total_campaign_sms;
            $subscription->personal_sms_quota = $plan->monthly_sms_quota;
            $subscription->sms_used = 0;
            $subscription->campaigns_used = 0;
            $subscription->next_renewal_date = $expiresAt;
            $subscription->is_auto_renew = true;
            $subscription->save();

            $durationType = $duration === 'annual' ? 'annuel' : 'mensuel';
            return redirect()->route('subscription.dashboard')->with('success', "Votre abonnement $durationType a été activé avec succès!");
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

            return redirect()->route('subscription.dashboard')->with('success', "$smsToAdd SMS ont été ajoutés à votre quota avec succès!");
        } else if ($addonType === 'clients') {
            // 100 clients supplémentaires pour 2000 FCFA
            $clientsToAdd = $quantity * 100;
            $subscription->clients_limit += $clientsToAdd;
            $subscription->save();

            return redirect()->route('subscription.dashboard')->with('success', "Capacité augmentée de $clientsToAdd clients supplémentaires!");
        }

        return redirect()->route('subscription.dashboard')->with('error', 'Option non reconnue.');
    }

    /**
     * Page de confirmation de paiement
     */
    public function showPaymentConfirmation(Request $request)
    {
        $data = $request->validate([
            'plan_id' => 'nullable|exists:plans,id',
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
            $plan = Plan::find($data['plan_id']);
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
     * Activer directement un abonnement en mode développement
     */
    public function directActivation(Plan $plan, string $duration = 'monthly')
    {
        if (!in_array($duration, ['monthly', 'annual'])) {
            $duration = 'monthly';
        }

        Log::info('Activation directe de plan en mode TEST', [
            'user_id' => Auth::id(),
            'plan_id' => $plan->id,
            'plan_name' => $plan->name,
            'duration' => $duration,
        ]);

        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        try {
            $existingSubscription = $user->subscription;

            // Déterminer la date d'expiration en fonction de la durée
            $expiresAt = $duration === 'annual' ? now()->addYear() : now()->addMonth();

            if ($existingSubscription && $existingSubscription->status === 'active') {
                // Mettre à jour l'abonnement existant
                Log::info('Mise à jour d\'un abonnement existant', [
                    'subscription_id' => $existingSubscription->id
                ]);

                $existingSubscription->update([
                    'plan_id' => $plan->id,
                    'plan' => $plan->name,
                    'duration' => $duration,
                    'clients_limit' => $plan->max_clients,
                    'campaigns_limit' => $plan->max_campaigns_per_month,
                    'sms_allowed' => $plan->total_campaign_sms,
                    'personal_sms_quota' => $plan->monthly_sms_quota,
                    'expires_at' => $expiresAt,
                    'next_renewal_date' => $expiresAt,
                    'status' => 'active',
                ]);

                $durationType = $duration === 'annual' ? 'annuel' : 'mensuel';
                return redirect()->route('subscription.dashboard')
                    ->with('success', "Votre abonnement $durationType a été mis à jour avec succès (MODE TEST)!");
            } else {
                // Créer un nouvel abonnement
                Log::info('Création d\'un nouvel abonnement');

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
                $subscription->sms_allowed = $plan->total_campaign_sms;
                $subscription->personal_sms_quota = $plan->monthly_sms_quota;
                $subscription->sms_used = 0;
                $subscription->campaigns_used = 0;
                $subscription->next_renewal_date = $expiresAt;
                $subscription->is_auto_renew = true;

                Log::info('Données de l\'abonnement avant sauvegarde', [
                    'data' => $subscription->toArray()
                ]);

                $subscription->save();

                Log::info('Abonnement créé avec succès', [
                    'subscription_id' => $subscription->id
                ]);

                $durationType = $duration === 'annual' ? 'annuel' : 'mensuel';
                return redirect()->route('subscription.dashboard')
                    ->with('success', "Votre abonnement $durationType a été activé avec succès (MODE TEST)!");
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'activation directe de l\'abonnement', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->route('subscription.plans')
                ->with('error', 'Erreur lors de l\'activation: ' . $e->getMessage());
        }
    }
}
