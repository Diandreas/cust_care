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
        // Journaliser le début du processus
        $this->writeActivationLog('Début du processus de paiement', [
            'plan_id' => $planId,
            'method' => $request->method(),
            'user_id' => Auth::id() ?? 'non connecté',
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);
        
        // Pour les requêtes GET, rediriger vers la page des plans
        if ($request->isMethod('get')) {
            $this->writeActivationLog('Redirection vers les plans (requête GET)', [
                'plan_id' => $planId
            ]);
            return redirect()->route('subscription.plans');
        }

        try {
            // Validation avec correction pour simulation_mode
            $rules = [
                'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer,notchpay,paypal',
                'duration' => 'required|string|in:monthly,annual',
            ];
            
            // Ne validons simulation_mode que s'il est présent
          
            $validated = $request->validate($rules);
            
           
            $this->writeActivationLog('Validation des données de paiement réussie', [
                'plan_id' => $planId,
                'payment_method' => $validated['payment_method'],
                'duration' => $validated['duration']
            ]);

            $plan = Plan::findOrFail($planId);
            $user = Auth::user();
            
            if (!$user) {
                $this->writeActivationLog('ERREUR: Utilisateur non authentifié', [
                    'plan_id' => $planId
                ]);
                return redirect()->route('login')->with('error', 'Vous devez être connecté pour souscrire à un forfait.');
            }
            
            $this->writeActivationLog('Utilisateur et plan identifiés', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'plan_id' => $plan->id,
                'plan_name' => $plan->name
            ]);

            // Calculer le prix
            $price = $validated['duration'] === 'annual' ? $plan->annual_price : $plan->price;
            
            $this->writeActivationLog('Prix calculé', [
                'price' => $price,
                'duration' => $validated['duration'],
                'is_annual' => $validated['duration'] === 'annual'
            ]);

            // Pour le mode de test/simulation
          
                $this->writeActivationLog('Mode simulation activé - Activation directe', [
                    'user_id' => $user->id,
                    'plan_id' => $plan->id
                ]);
                // Créer directement la souscription sans passer par le paiement
                return $this->finalizeSubscription($user->id, $plan, $validated['duration'], $price, $validated['payment_method']);
            

            // $this->writeActivationLog('Redirection vers la page de confirmation', [
            //     'payment_method' => $validated['payment_method']
            // ]);
            
            // Rediriger vers la page de confirmation
            return Inertia::render('Payment/Confirmation', [
                'plan' => $plan,
                'addonType' => null,
                'quantity' => null,
                'amount' => $price,
                'paymentMethod' => $validated['payment_method'],
                'duration' => $validated['duration'],
            ]);
        } catch (\Exception $e) {
            $this->writeActivationLog('ERREUR dans processSubscriptionPayment', [
                'error' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine(),
                'plan_id' => $planId,
                'request_data' => $request->all()
            ]);
            
            return redirect()->route('subscription.plans')
                ->with('error', 'Erreur lors du processus de paiement: ' . $e->getMessage());
        }
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
        try {
            if (!$userId || !is_numeric($userId)) {
                throw new \Exception("ID utilisateur invalide: $userId");
            }
            
            if (!$plan || !($plan instanceof Plan)) {
                throw new \Exception("Plan invalide");
            }
            
            if (!in_array($duration, ['monthly', 'annual'])) {
                throw new \Exception("Durée invalide: $duration. Utilisez 'monthly' ou 'annual'.");
            }
            
            $user = User::findOrFail($userId);
            $expiresAt = $duration === 'annual' ? now()->addYear() : now()->addMonth();

            $this->writeActivationLog('Début de la finalisation de l\'abonnement', [
                'user_id' => $userId,
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'duration' => $duration,
                'amount' => $amount,
                'payment_method' => $paymentMethod,
                'expires_at' => $expiresAt->format('Y-m-d H:i:s')
            ]);

            DB::beginTransaction();
            
            $existingSubscription = $user->subscription;
            $description = '';
            $transactionType = '';

            $this->writeActivationLog('Vérification de l\'utilisateur et de son abonnement', [
                'user_exists' => $user ? true : false,
                'user_id' => $user->id,
                'has_subscription' => $existingSubscription ? true : false,
                'subscription_id' => $existingSubscription ? $existingSubscription->id : null,
                'subscription_status' => $existingSubscription ? $existingSubscription->status : null
            ]);

            if ($existingSubscription) {
                $this->writeActivationLog('Mise à jour d\'un abonnement existant', [
                    'subscription_id' => $existingSubscription->id,
                    'old_plan' => $existingSubscription->plan,
                    'new_plan' => $plan->name,
                    'old_expires_at' => $existingSubscription->expires_at,
                    'new_expires_at' => $expiresAt
                ]);
                
                // Préparer les données de mise à jour
                $updateData = [
                    'plan' => $plan->name,
                    'plan_id' => $plan->id,
                    'expires_at' => $expiresAt,
                    'sms_allowed' => $plan->total_campaign_sms ?? 200,
                    'clients_limit' => $plan->max_clients ?? 100,
                    'campaigns_limit' => $plan->max_campaigns_per_month ?? 2,
                    'personal_sms_quota' => $plan->monthly_sms_quota ?? 50,
                    'sms_used' => 0,
                    'campaigns_used' => 0,
                    'status' => 'active',
                    'duration' => $duration,
                    'is_auto_renew' => true,
                    'next_renewal_date' => $expiresAt,
                ];
                
                // Mettre à jour l'abonnement existant
                $existingSubscription->update($updateData);

                $transactionType = 'subscription_update';
                $description = 'Mise à jour d\'abonnement vers ' . $plan->name;
                
                $this->writeActivationLog('Abonnement existant mis à jour avec succès', [
                    'subscription_id' => $existingSubscription->id,
                    'updated_fields' => array_keys($updateData)
                ]);
                
            } else {
                $this->writeActivationLog('Création d\'un nouvel abonnement', [
                    'plan' => $plan->name,
                    'plan_id' => $plan->id,
                    'duration' => $duration
                ]);
                
                // Détails complets de l'abonnement à créer
                $subscriptionData = [
                    'user_id' => $user->id,
                    'plan' => $plan->name,
                    'plan_id' => $plan->id,
                    'starts_at' => now(),
                    'expires_at' => $expiresAt,
                    'sms_allowed' => $plan->total_campaign_sms ?? 200,
                    'sms_used' => 0,
                    'campaigns_used' => 0,
                    'clients_limit' => $plan->max_clients ?? 100,
                    'campaigns_limit' => $plan->max_campaigns_per_month ?? 2,
                    'personal_sms_quota' => $plan->monthly_sms_quota ?? 50,
                    'status' => 'active',
                    'duration' => $duration,
                    'is_auto_renew' => true,
                    'next_renewal_date' => $expiresAt,
                ];
                
                $this->writeActivationLog('Données de l\'abonnement à créer', $subscriptionData);
                
                // Créer un nouvel abonnement
                $subscription = Subscription::create($subscriptionData);
                
                if (!$subscription || !$subscription->exists) {
                    throw new \Exception("Échec de la création de l'abonnement. Vérifiez les données.");
                }

                $transactionType = 'subscription';
                $description = 'Nouvel abonnement ' . $plan->name . ' (' . $duration . ')';
                
                $this->writeActivationLog('Nouvel abonnement créé avec succès', [
                    'subscription_id' => $subscription->id,
                    'expires_at' => $expiresAt->format('Y-m-d H:i:s')
                ]);
            }

            $this->writeActivationLog('Création de la transaction', [
                'user_id' => $user->id,
                'description' => $description,
                'amount' => $amount,
                'type' => $transactionType,
                'status' => 'completed',
                'payment_method' => $paymentMethod
            ]);

            // Vérifier que le type est défini correctement
            if (empty($transactionType)) {
                $transactionType = 'subscription';
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
            
            if (!$transaction || !$transaction->exists) {
                throw new \Exception("Échec de la création de la transaction. Les données de l'abonnement ont été sauvegardées.");
            }
            
            $this->writeActivationLog('Transaction créée avec succès', [
                'transaction_id' => $transaction->id
            ]);

            DB::commit();
            $this->writeActivationLog('Finalisation de l\'abonnement terminée avec succès');

            $durationType = $duration === 'annual' ? 'annuel' : 'mensuel';
            return redirect()->route('subscription.dashboard')
                ->with('success', "Votre abonnement $durationType a été activé avec succès!");
            
        } catch (\Exception $e) {
            DB::rollback();
            $this->writeActivationLog('ERREUR lors de la finalisation de l\'abonnement', [
                'error' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->route('subscription.plans')
                ->with('error', 'Erreur lors de l\'activation: ' . $e->getMessage());
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
        try {
            $this->writeActivationLog('Affichage de la page de confirmation', [
                'request_data' => $request->all()
            ]);
            
            $rules = [
                'plan_id' => 'nullable|exists:plans,id',
                'addon_type' => 'nullable|in:sms,clients',
                'quantity' => 'nullable|integer|min:1',
                'payment_method' => 'required|string|in:mobile_money,credit_card,bank_transfer,notchpay,paypal',
                'duration' => 'nullable|string|in:monthly,annual',
            ];
            
            // Validation conditionnelle
            if ($request->has('simulation_mode')) {
                $rules['simulation_mode'] = 'boolean';
            }
            
            $data = $request->validate($rules);
            $simulationMode = $request->has('simulation_mode') ? filter_var($request->simulation_mode, FILTER_VALIDATE_BOOLEAN) : false;
            
            $plan = null;
            $addonType = null;
            $quantity = null;
            $amount = 0;
            $duration = $data['duration'] ?? 'monthly';

            if (isset($data['plan_id'])) {
                $plan = Plan::find($data['plan_id']);
                if (!$plan) {
                    throw new \Exception("Plan introuvable avec l'ID " . $data['plan_id']);
                }
                $amount = $duration === 'annual' ? $plan->annual_price : $plan->price;
                
                $this->writeActivationLog('Confirmation de paiement pour un plan', [
                    'plan_id' => $plan->id,
                    'plan_name' => $plan->name,
                    'amount' => $amount,
                    'duration' => $duration
                ]);
            } else if (isset($data['addon_type'])) {
                $addonType = $data['addon_type'];
                $quantity = $data['quantity'];

                if ($addonType === 'sms') {
                    $amount = $quantity * 1000; // 1000 FCFA pour 100 SMS
                } else if ($addonType === 'clients') {
                    $amount = $quantity * 2000; // 2000 FCFA pour 100 clients
                }
                
                $this->writeActivationLog('Confirmation de paiement pour un addon', [
                    'addon_type' => $addonType,
                    'quantity' => $quantity,
                    'amount' => $amount
                ]);
            }

            return Inertia::render('Payment/Confirmation', [
                'plan' => $plan,
                'addonType' => $addonType,
                'quantity' => $quantity,
                'amount' => $amount,
                'paymentMethod' => $data['payment_method'],
                'duration' => $duration,
                'simulationMode' => $simulationMode,
            ]);
        } catch (\Exception $e) {
            $this->writeActivationLog('ERREUR dans showPaymentConfirmation', [
                'error' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine(),
                'request_data' => $request->all()
            ]);
            
            return redirect()->route('subscription.plans')
                ->with('error', 'Erreur lors de l\'affichage de la confirmation: ' . $e->getMessage());
        }
    }

    /**
     * Activer directement un abonnement en mode développement
     */
    public function directActivation(Plan $plan, string $duration = 'monthly')
    {
        try {
            // Journaliser le début de l'activation directe
            $this->writeActivationLog("===== DÉBUT ACTIVATION DIRECTE =====", [
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'duration' => $duration,
                'timestamp' => now()->format('Y-m-d H:i:s'),
                'user_id' => Auth::id() ?? 'non connecté'
            ]);
            
            if (!in_array($duration, ['monthly', 'annual'])) {
                $duration = 'monthly';
                $this->writeActivationLog("Durée invalide corrigée en 'monthly'", [
                    'original_duration' => $duration
                ]);
            }
            
            $user = Auth::user();
            
            if (!$user) {
                $this->writeActivationLog("ERREUR: Tentative d'activation sans utilisateur connecté");
                return redirect()->route('login')
                    ->with('error', 'Vous devez être connecté pour activer un forfait.');
            }
            
            $this->writeActivationLog("Utilisateur identifié pour activation", [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_name' => $user->name
            ]);
            
            // Vérifier que le plan existe
            if (!$plan || !$plan->exists) {
                $this->writeActivationLog("ERREUR: Plan invalide ou inexistant", [
                    'plan_id' => $plan->id ?? 'inconnu' 
                ]);
                return redirect()->route('subscription.plans')
                    ->with('error', 'Le forfait sélectionné est invalide.');
            }
            
            $this->writeActivationLog("Plan identifié pour activation", [
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
                'price' => $duration === 'annual' ? $plan->annual_price : $plan->price,
                'max_clients' => $plan->max_clients,
                'sms_quota' => $plan->monthly_sms_quota
            ]);

            // Vérifier l'abonnement existant
            $existingSubscription = $user->subscription;
            $this->writeActivationLog("Vérification de l'abonnement existant", [
                'has_subscription' => $existingSubscription ? true : false,
                'subscription_id' => $existingSubscription ? $existingSubscription->id : null,
                'subscription_status' => $existingSubscription ? $existingSubscription->status : null
            ]);

            // Déterminer la date d'expiration en fonction de la durée
            $expiresAt = $duration === 'annual' ? now()->addYear() : now()->addMonth();
            $this->writeActivationLog("Date d'expiration calculée", [
                'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
                'is_annual' => $duration === 'annual'
            ]);

            DB::beginTransaction();
            try {
                // Selon qu'il existe un abonnement ou non
                if ($existingSubscription && $existingSubscription->status === 'active') {
                    // Mettre à jour l'abonnement existant
                    $this->writeActivationLog("Mise à jour d'un abonnement existant", [
                        'subscription_id' => $existingSubscription->id,
                        'old_plan' => $existingSubscription->plan,
                        'new_plan' => $plan->name,
                        'old_expires_at' => $existingSubscription->expires_at,
                        'new_expires_at' => $expiresAt->format('Y-m-d H:i:s')
                    ]);

                    $updateData = [
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
                    ];

                    $this->writeActivationLog("Données de mise à jour de l'abonnement", $updateData);

                    // Effectuer la mise à jour
                    $existingSubscription->update($updateData);
                    
                    $this->writeActivationLog("Abonnement mis à jour avec succès", [
                        'subscription_id' => $existingSubscription->id,
                        'expires_at' => $existingSubscription->fresh()->expires_at
                    ]);
                    
                    // Créer une transaction pour l'audit
                    $price = $duration === 'annual' ? $plan->annual_price : $plan->price;
                    try {
                        $transaction = Transaction::create([
                            'user_id' => $user->id,
                            'description' => 'Mise à jour abonnement ' . $plan->name . ' (' . $duration . ') via activation directe',
                            'amount' => $price,
                            'type' => 'subscription_update',
                            'status' => 'completed',
                            'payment_method' => 'direct_activation',
                        ]);
                        
                        $this->writeActivationLog("Transaction créée pour mise à jour", [
                            'transaction_id' => $transaction->id,
                            'amount' => $price,
                            'type' => 'subscription_update'
                        ]);
                    } catch (\Exception $e) {
                        $this->writeActivationLog("AVERTISSEMENT: Erreur création transaction (abonnement quand même mis à jour)", [
                            'error' => $e->getMessage()
                        ]);
                    }

                    $durationType = $duration === 'annual' ? 'annuel' : 'mensuel';
                    DB::commit();
                    
                    $this->writeActivationLog("===== FIN ACTIVATION DIRECTE (MISE À JOUR) =====");
                    
                    return redirect()->route('subscription.dashboard')
                        ->with('success', "Votre abonnement $durationType a été mis à jour avec succès (MODE TEST)!");
                } else {
                    // Créer un nouvel abonnement
                    $this->writeActivationLog("Création d'un nouvel abonnement");

                    $subscriptionData = [
                        'user_id' => $user->id,
                        'plan_id' => $plan->id,
                        'plan' => $plan->name,
                        'status' => 'active',
                        'duration' => $duration,
                        'starts_at' => now(),
                        'expires_at' => $expiresAt,
                        'clients_limit' => $plan->max_clients,
                        'campaigns_limit' => $plan->max_campaigns_per_month,
                        'sms_allowed' => $plan->total_campaign_sms,
                        'personal_sms_quota' => $plan->monthly_sms_quota,
                        'sms_used' => 0,
                        'campaigns_used' => 0,
                        'next_renewal_date' => $expiresAt,
                        'is_auto_renew' => true,
                    ];

                    $this->writeActivationLog("Données du nouvel abonnement", $subscriptionData);
                    
                    // Créer l'abonnement
                    $subscription = new Subscription($subscriptionData);
                    $saved = $subscription->save();
                    
                    if (!$saved) {
                        throw new \Exception("Erreur lors de la sauvegarde de l'abonnement");
                    }
                    
                    $this->writeActivationLog("Nouvel abonnement créé avec succès", [
                        'subscription_id' => $subscription->id
                    ]);

                    // Créer une transaction pour l'audit
                    try {
                        $price = $duration === 'annual' ? $plan->annual_price : $plan->price;
                        $transaction = Transaction::create([
                            'user_id' => $user->id,
                            'description' => 'Activation directe abonnement ' . $plan->name . ' (' . $duration . ')',
                            'amount' => $price,
                            'type' => 'subscription',
                            'status' => 'completed',
                            'payment_method' => 'direct_activation',
                        ]);
                        
                        $this->writeActivationLog("Transaction d'audit créée avec succès", [
                            'transaction_id' => $transaction->id,
                            'amount' => $price
                        ]);
                    } catch (\Exception $e) {
                        $this->writeActivationLog("AVERTISSEMENT: Erreur lors de la création de la transaction", [
                            'error' => $e->getMessage(),
                            'note' => "L'abonnement a quand même été créé"
                        ]);
                    }

                    $durationType = $duration === 'annual' ? 'annuel' : 'mensuel';
                    DB::commit();
                    
                    $this->writeActivationLog("===== FIN ACTIVATION DIRECTE (NOUVEAU) =====");
                    
                    return redirect()->route('subscription.dashboard')
                        ->with('success', "Votre abonnement $durationType a été activé avec succès (MODE TEST)!");
                }
            } catch (\Exception $e) {
                DB::rollBack();
                $this->writeActivationLog("ERREUR CRITIQUE: Échec de l'activation directe", [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile() . ':' . $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                return redirect()->route('subscription.plans')
                    ->with('error', 'Erreur lors de l\'activation: ' . $e->getMessage());
            }
        } catch (\Exception $e) {
            $this->writeActivationLog("ERREUR FATALE dans directActivation", [
                'error' => $e->getMessage(),
                'file' => $e->getFile() . ':' . $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->route('subscription.plans')
                ->with('error', 'Erreur système: ' . $e->getMessage());
        }
    }

    /**
     * Écrire un log d'activation dans un fichier spécifique avec vérification renforcée
     */
    private function writeActivationLog($message, $data = [])
    {
        try {
            // 1. Initialiser des logs de secours pour tracer les problèmes
            $backupLog = sys_get_temp_dir() . '/activation_backup.log';
            file_put_contents($backupLog, date('Y-m-d H:i:s') . " - DEBUG: Tentative de log: $message\n", FILE_APPEND);
            
            // 2. Déterminer le chemin du fichier de log
            $baseDir = storage_path('logs');
            $logFile = $baseDir . '/activations.log';
            
            // 3. S'assurer que le répertoire existe
            if (!is_dir($baseDir)) {
                file_put_contents($backupLog, date('Y-m-d H:i:s') . " - DEBUG: Création du répertoire: $baseDir\n", FILE_APPEND);
                if (!mkdir($baseDir, 0777, true)) {
                    throw new \Exception("Impossible de créer le répertoire $baseDir");
                }
            }
            
            // 4. Vérifier les permissions
            if (!is_writable($baseDir)) {
                // Tentative de correction des permissions
                chmod($baseDir, 0777);
                if (!is_writable($baseDir)) {
                    throw new \Exception("Le répertoire $baseDir n'est pas accessible en écriture");
                }
            }
            
            // 5. Formater le message
            $timestamp = date('Y-m-d H:i:s');
            $dataString = '';
            if (!empty($data)) {
                $dataString = ' - ' . json_encode($data, JSON_UNESCAPED_UNICODE);
            }
            $logMessage = "[$timestamp] $message$dataString\n";
            
            // 6. Écrire dans le fichier
            $success = file_put_contents($logFile, $logMessage, FILE_APPEND);
            
            // 7. Vérifier le résultat
            if ($success === false) {
                $error = error_get_last();
                throw new \Exception("Échec d'écriture dans le fichier: " . ($error ? $error['message'] : 'Raison inconnue'));
            }
            
            // 8. Journaliser également dans le log Laravel standard
            \Illuminate\Support\Facades\Log::info("ACTIVATION: $message", $data);
            
            return true;
        } catch (\Exception $e) {
            // Logger l'erreur partout où possible
            error_log("ERREUR writeActivationLog: " . $e->getMessage());
            
            // Essayer de logger dans le fichier error_log de PHP
            $phpErrorLog = ini_get('error_log');
            if (!empty($phpErrorLog) && is_writable(dirname($phpErrorLog))) {
                file_put_contents($phpErrorLog, date('Y-m-d H:i:s') . " - ERREUR ACTIVATION: " . $e->getMessage() . "\n", FILE_APPEND);
            }
            
            // Essayer de logger dans un fichier temporaire
            $tempLog = sys_get_temp_dir() . '/activation_errors.log';
            file_put_contents($tempLog, date('Y-m-d H:i:s') . " - ERREUR: " . $e->getMessage() . "\n", FILE_APPEND);
            
            try {
                // Essayer quand même de logger dans Laravel si possible
                \Illuminate\Support\Facades\Log::error("ERREUR ACTIVATION: " . $e->getMessage(), [
                    'exception' => $e->getTraceAsString(),
                    'message_original' => $message,
                    'data' => $data
                ]);
            } catch (\Exception $logEx) {
                // Ne rien faire si cette tentative échoue aussi
            }
            
            return false;
        }
    }
}
