<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ClientImportController extends Controller
{
    /**
     * Importer des contacts simples (nom + téléphone)
     * Format attendu: JSON array avec des objets {name: "Nom", phone: "Téléphone"}
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'contacts' => 'required|json',
            ]);
            
            $user = Auth::user();
            
            // Récupérer les informations d'abonnement pour vérifier les limites
            $subscription = $this->getUserSubscription($user);
            $currentClientCount = $subscription['clientsCount'];
            $clientLimit = $subscription['clientsLimit'];
            
            $contacts = json_decode($request->contacts, true);
            
            if (!is_array($contacts)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format de contacts invalide'
                ], 422);
            }
            
            // Vérifier si l'importation dépasserait la limite
            if ($currentClientCount + count($contacts) > $clientLimit) {
                return response()->json([
                    'success' => false,
                    'message' => "L'importation dépasserait la limite de clients pour votre plan (" . $clientLimit . ")."
                ], 403);
            }
            
            $imported = 0;
            $updated = 0;
            $errors = [];
            
            foreach ($contacts as $contact) {
                try {
                    // Valider chaque contact
                    $validator = Validator::make($contact, [
                        'name' => 'required|string|max:255',
                        'phone' => 'required|string|max:20',
                    ]);
                    
                    if ($validator->fails()) {
                        $errors[] = "Contact invalide: " . json_encode($validator->errors()->all());
                        continue;
                    }
                    
                    // Nettoyer le numéro de téléphone
                    $phone = $this->normalizePhoneNumber($contact['phone']);
                    
                    // Vérifier si le client existe déjà
                    $existingClient = Client::where('phone', $phone)
                                    ->where('user_id', $user->id)
                                    ->first();
                    
                    if ($existingClient) {
                        // Mettre à jour le nom si nécessaire
                        if ($existingClient->name !== $contact['name']) {
                            $existingClient->name = $contact['name'];
                            $existingClient->save();
                            $updated++;
                        }
                    } else {
                        // Créer un nouveau client
                        Client::create([
                            'name' => $contact['name'],
                            'phone' => $phone,
                            'user_id' => $user->id,
                        ]);
                        $imported++;
                    }
                } catch (\Exception $e) {
                    Log::error('Erreur lors de l\'importation d\'un contact: ' . $e->getMessage(), [
                        'contact' => json_encode($contact)
                    ]);
                    $errors[] = "Erreur lors de l'importation de " . ($contact['name'] ?? 'contact') . ": " . $e->getMessage();
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => "Importation terminée. $imported contacts importés, $updated mis à jour.",
                'imported' => $imported,
                'updated' => $updated,
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'importation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Normaliser un numéro de téléphone
     */
    private function normalizePhoneNumber($phone)
    {
        // Supprimer tous les caractères non numériques sauf +
        $normalized = preg_replace('/[^0-9+]/', '', $phone);
        
        // S'assurer que le numéro commence par un indicatif de pays si ce n'est pas déjà le cas
        if (!str_starts_with($normalized, '+')) {
            // Assumer le format local par défaut
            if (str_starts_with($normalized, '0')) {
                $normalized = '+33' . substr($normalized, 1); // Pour la France
            } else {
                // Si pas d'indicatif et ne commence pas par 0, ajouter juste un +
                $normalized = '+' . $normalized;
            }
        }
        
        return $normalized;
    }
    
    /**
     * Obtenir les informations d'abonnement de l'utilisateur
     */
    private function getUserSubscription($user)
    {
        // Vérifier si l'utilisateur a un abonnement actif
        $activeSubscription = $user->subscription?->isActive() ?? false;
        
        // Compter le nombre de clients
        $clientCount = $user->clients()->count();
        
        // Mode gratuit (sans abonnement actif)
        if (!$activeSubscription) {
            return [
                'plan' => 'Plan Gratuit',
                'clientsLimit' => 50,
                'clientsCount' => $clientCount,
                'smsBalance' => 10 - $user->messages()->whereRaw("strftime('%m', created_at) = ?", [sprintf('%02d', now()->month)])->count(),
                'isFreePlan' => true
            ];
        }
        
        // Si l'utilisateur a un abonnement, retourner les vraies informations
        return [
            'plan' => $user->subscription->plan->name ?? 'Standard',
            'clientsLimit' => $user->subscription->plan->client_limit ?? 100,
            'clientsCount' => $clientCount,
            'smsBalance' => $user->subscription->sms_balance ?? 0,
            'isFreePlan' => false
        ];
    }
}