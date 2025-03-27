<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    /**
     * Afficher le tableau de bord d'abonnement de l'utilisateur
     */
    public function dashboard()
    {
        $user = Auth::user();
        $subscription = $user->subscription;
        
        // Récupérer les statistiques
        $clientsQuery = DB::table('clients')->where('user_id', $user->id);
        $clientsCount = $clientsQuery->count();
        
        $messagesQuery = DB::table('messages')->where('user_id', $user->id);
        $messagesSent = $messagesQuery->count();
        
        $campaignsCount = DB::table('campaigns')->where('user_id', $user->id)->count();
        
        // Format subscription data for frontend
        $formattedSubscription = null;
        if ($subscription) {
            // Assurer que les valeurs des SMS ne sont pas nulles ou zéro
            $smsAllowed = $subscription->sms_allowed > 0 ? $subscription->sms_allowed : ($subscription->personal_sms_quota ?? 0);
            $smsUsed = $subscription->sms_used ?? $messagesSent;
            
            // Format des donnés d'abonnement pour le frontend
            $formattedSubscription = [
                'id' => $subscription->id,
                'plan' => $subscription->plan,
                'status' => $subscription->status,
                'current_period_start' => $subscription->starts_at,
                'current_period_end' => $subscription->expires_at,
                'cancel_at_period_end' => ($subscription->status === 'cancelled'),
                'duration' => $subscription->duration ?? 'monthly',
                'is_auto_renew' => $subscription->is_auto_renew ?? true,
                'next_renewal_date' => $subscription->expires_at,
                'sms_usage' => [
                    'used' => $smsUsed,
                    'total' => $smsAllowed,
                ],
                'limits' => [
                    'clients' => $subscription->clients_limit ?? 0,
                    'campaigns' => $subscription->campaigns_limit ?? 0,
                ],
                'campaigns_used' => $subscription->campaigns_used ?? $campaignsCount,
                'clients_count' => $clientsCount,
            ];
        }
        
        // Récupérer les transactions récentes
        $transactions = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($transaction) {
                // S'assurer que le montant est un nombre avant de l'envoyer au frontend
                $amount = $transaction->amount;
                if (!is_numeric($amount)) {
                    // Tenter de convertir en nombre
                    $amount = floatval($amount);
                }
                
                return [
                    'id' => $transaction->id,
                    'description' => $transaction->description,
                    'amount' => $amount,
                    'date' => $transaction->created_at,
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                ];
            });
        
        return Inertia::render('Subscription/Dashboard', [
            'subscription' => $formattedSubscription,
            'transactions' => $transactions,
            'clients_count' => $clientsCount,
            'messages_sent' => $messagesSent,
        ]);
    }
    
    /**
     * Afficher l'ancienne page d'abonnement (pour compatibilité)
     */
    public function index()
    {
        return redirect()->route('subscription.dashboard');
    }
    
    /**
     * Afficher la liste des plans d'abonnement
     */
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
    
    /**
     * Souscrire à un abonnement
     */
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
                'campaigns_used' => 0, // Réinitialiser l'utilisation
                'status' => 'active',
                'duration' => $validated['duration'],
                'is_auto_renew' => true,
            ]);
            
            $transactionType = 'addon';
            $description = 'Changement de plan d\'abonnement vers ' . ucfirst($plan);
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
                'campaigns_used' => 0,
                'clients_limit' => $planLimits[$plan]['clients_limit'],
                'campaigns_limit' => $planLimits[$plan]['campaigns_limit'],
                'personal_sms_quota' => $planLimits[$plan]['personal_sms_limit'],
                'status' => 'active',
                'duration' => $validated['duration'],
                'is_auto_renew' => true,
            ]);
            
            $transactionType = 'subscription';
            $description = 'Nouvel abonnement ' . ucfirst($plan) . ' (' . $validated['duration'] . ')';
        }
        
        // Créer une nouvelle transaction
        Transaction::create([
            'user_id' => $user->id,
            'description' => $description,
            'amount' => $price,
            'type' => $transactionType,
            'status' => 'completed',
        ]);
        
        return redirect()->route('subscription.dashboard')->with('success', 'Abonnement souscrit avec succès.');
    }
    
    /**
     * Afficher la page de recharge SMS
     */
    public function topUp()
    {
        $user = Auth::user();
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->route('subscription.plans')
                ->with('error', 'Vous devez avoir un abonnement actif pour acheter des SMS supplémentaires.');
        }
        
        $smsPackages = [
            [
                'id' => 1,
                'amount' => 100,
                'price' => 1000,
            ],
            [
                'id' => 2,
                'amount' => 500,
                'price' => 4500,
            ],
            [
                'id' => 3,
                'amount' => 1000,
                'price' => 8000,
            ],
            [
                'id' => 4,
                'amount' => 5000,
                'price' => 35000,
            ],
        ];
        
        return Inertia::render('Subscription/TopUp', [
            'smsPackages' => $smsPackages,
            'subscription' => [
                'id' => $subscription->id,
                'sms_usage' => [
                    'used' => $subscription->sms_used ?? 0,
                    'total' => $subscription->sms_allowed ?? 0,
                ],
            ],
        ]);
    }
    
    /**
     * Traiter l'achat de SMS supplémentaires
     */
    public function processTopUp(Request $request)
    {
        $validated = $request->validate([
            'sms_amount' => 'required|integer|min:100|max:5000',
            'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer',
        ]);
        
        $user = Auth::user();
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->route('subscription.plans')
                ->with('error', 'Vous devez avoir un abonnement actif pour acheter des SMS supplémentaires.');
        }
        
        // Calculer le prix en fonction du montant de SMS
        $price = 0;
        if ($validated['sms_amount'] <= 100) {
            $price = 1000;
        } elseif ($validated['sms_amount'] <= 500) {
            $price = 4500;
        } elseif ($validated['sms_amount'] <= 1000) {
            $price = 8000;
        } else {
            $price = 35000;
        }
        
        // Ajouter les SMS à l'abonnement
        $subscription->sms_allowed += $validated['sms_amount'];
        $subscription->save();
        
        // Créer une transaction
        Transaction::create([
            'user_id' => $user->id,
            'description' => 'Achat de ' . $validated['sms_amount'] . ' SMS supplémentaires',
            'amount' => $price,
            'type' => 'addon',
            'status' => 'completed',
        ]);
        
        return redirect()->route('subscription.dashboard')
            ->with('success', $validated['sms_amount'] . ' SMS supplémentaires ont été ajoutés à votre compte.');
    }
    
    /**
     * Afficher la page d'augmentation de limite de clients
     */
    public function increaseLimit()
    {
        $user = Auth::user();
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->route('subscription.plans')
                ->with('error', 'Vous devez avoir un abonnement actif pour augmenter vos limites.');
        }
        
        $clientPackages = [
            [
                'id' => 1,
                'amount' => 100,
                'price' => 2000,
            ],
            [
                'id' => 2,
                'amount' => 500,
                'price' => 8000,
            ],
            [
                'id' => 3,
                'amount' => 1000,
                'price' => 15000,
            ],
        ];
        
        return Inertia::render('Subscription/IncreaseLimit', [
            'clientPackages' => $clientPackages,
            'subscription' => [
                'id' => $subscription->id,
                'clients_limit' => $subscription->clients_limit,
            ],
        ]);
    }
    
    /**
     * Traiter l'augmentation de limite de clients
     */
    public function processIncreaseLimit(Request $request)
    {
        $validated = $request->validate([
            'clients_amount' => 'required|integer|min:100|max:1000',
            'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer',
        ]);
        
        $user = Auth::user();
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->route('subscription.plans')
                ->with('error', 'Vous devez avoir un abonnement actif pour augmenter vos limites.');
        }
        
        // Calculer le prix en fonction du nombre de clients
        $price = 0;
        if ($validated['clients_amount'] <= 100) {
            $price = 2000;
        } elseif ($validated['clients_amount'] <= 500) {
            $price = 8000;
        } else {
            $price = 15000;
        }
        
        // Augmenter la limite de clients
        $subscription->clients_limit += $validated['clients_amount'];
        $subscription->save();
        
        // Créer une transaction
        Transaction::create([
            'user_id' => $user->id,
            'description' => 'Augmentation de la limite de clients de ' . $validated['clients_amount'],
            'amount' => $price,
            'type' => 'addon',
            'status' => 'completed',
        ]);
        
        return redirect()->route('subscription.dashboard')
            ->with('success', 'Votre limite de clients a été augmentée de ' . $validated['clients_amount'] . '.');
    }
    
    /**
     * Afficher l'historique des transactions
     */
    public function transactions(Request $request)
    {
        $user = Auth::user();
        
        $transactions = Transaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->through(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'description' => $transaction->description,
                    'amount' => $transaction->amount,
                    'date' => $transaction->created_at,
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                ];
            });
        
        return Inertia::render('Subscription/Transactions', [
            'transactions' => $transactions,
        ]);
    }
    
    /**
     * Basculer l'état du renouvellement automatique
     */
    public function toggleAutoRenew(Request $request)
    {
        $user = Auth::user();
        $subscription = $user->subscription;
        
        if (!$subscription) {
            return redirect()->back()->with('error', 'Aucun abonnement actif trouvé.');
        }
        
        $subscription->is_auto_renew = !$subscription->is_auto_renew;
        $subscription->save();
        
        $message = $subscription->is_auto_renew 
            ? 'Le renouvellement automatique a été activé.'
            : 'Le renouvellement automatique a été désactivé.';
        
        return redirect()->back()->with('success', $message);
    }
    
    /**
     * Annuler l'abonnement à la fin de la période
     */
    public function cancelAtPeriodEnd(Request $request)
    {
        $user = Auth::user();
        $subscription = $user->subscription;
        
        if (!$subscription || $subscription->status !== 'active') {
            return redirect()->back()->with('error', 'Aucun abonnement actif trouvé.');
        }
        
        $subscription->status = 'cancelled';
        $subscription->save();
        
        // Créer un enregistrement de l'annulation
        Transaction::create([
            'user_id' => $user->id,
            'description' => 'Annulation d\'abonnement - Prendra fin le ' . $subscription->expires_at->format('d/m/Y'),
            'amount' => 0,
            'type' => 'subscription',
            'status' => 'completed',
        ]);
        
        return redirect()->back()->with('success', 'Votre abonnement a été annulé et prendra fin le ' . $subscription->expires_at->format('d/m/Y'));
    }
    
    /**
     * Afficher l'ancienne page d'options complémentaires (pour compatibilité)
     */
    public function addons()
    {
        return redirect()->route('subscription.dashboard');
    }
    
    /**
     * Afficher l'ancienne page de factures (remplacée par les transactions)
     */
    public function invoices()
    {
        return redirect()->route('subscription.transactions');
    }
}