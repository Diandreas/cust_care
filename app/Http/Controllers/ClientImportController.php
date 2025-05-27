<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ClientImportController extends Controller
{
    /**
     * Importer des contacts depuis un fichier CSV
     */
    public function importCsv(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt|max:5120', // 5MB max
                'mapping' => 'required|json',
            ]);

            $user = Auth::user();

            // Récupérer les informations d'abonnement pour vérifier les limites
            $subscription = $this->getUserSubscription($user);
            $currentClientCount = $subscription['clientsCount'];
            $clientLimit = $subscription['clientsLimit'];

            $mapping = json_decode($request->mapping, true);

            if (!is_array($mapping)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format de mapping invalide'
                ], 422);
            }

            // Vérifier que les champs obligatoires sont mappés
            $mappedFields = array_values($mapping);
            if (!in_array('name', $mappedFields) || !in_array('phone', $mappedFields)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les champs Nom et Téléphone sont obligatoires'
                ], 422);
            }

            // Lire le fichier CSV
            $file = $request->file('file');
            $content = file_get_contents($file->getRealPath());

            // Détecter l'encodage et convertir en UTF-8 si nécessaire
            $encoding = mb_detect_encoding($content, ['UTF-8', 'UTF-16', 'ISO-8859-1', 'Windows-1252'], true);
            if ($encoding !== 'UTF-8') {
                $content = mb_convert_encoding($content, 'UTF-8', $encoding);
            }

            $lines = preg_split('/\r?\n/', $content);
            $lines = array_filter($lines, function($line) {
                return trim($line) !== '';
            });

            if (count($lines) < 2) {
                return response()->json([
                    'success' => false,
                    'message' => 'Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données'
                ], 422);
            }

            // Parser la ligne d'en-tête
            $headers = $this->parseCsvLine($lines[0]);

            // Préparer les données à importer
            $contactsToImport = [];
            $errors = [];

            for ($i = 1; $i < count($lines); $i++) {
                $values = $this->parseCsvLine($lines[$i]);

                if (count($values) < count($headers)) {
                    // Compléter avec des valeurs vides si nécessaire
                    $values = array_pad($values, count($headers), '');
                }

                $contact = [];
                foreach ($headers as $index => $header) {
                    if (isset($mapping[$header]) && $mapping[$header] !== 'ignore') {
                        $contact[$mapping[$header]] = isset($values[$index]) ? trim($values[$index]) : '';
                    }
                }

                // Vérifier que les champs obligatoires sont présents
                if (!empty($contact['name']) && !empty($contact['phone'])) {
                    $contactsToImport[] = $contact;
                } else {
                    $errors[] = "Ligne " . ($i + 1) . ": Nom ou téléphone manquant";
                }
            }

            if (empty($contactsToImport)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun contact valide trouvé dans le fichier'
                ], 422);
            }

            // Vérifier si l'importation dépasserait la limite
            if ($currentClientCount + count($contactsToImport) > $clientLimit) {
                return response()->json([
                    'success' => false,
                    'message' => "L'importation dépasserait la limite de clients pour votre plan (" . $clientLimit . ")."
                ], 403);
            }

            // Importer les contacts
            $imported = 0;
            $updated = 0;

            foreach ($contactsToImport as $contact) {
                try {
                    // Nettoyer le numéro de téléphone
                    $phone = $this->normalizePhoneNumber($contact['phone']);

                    // Vérifier si le client existe déjà
                    $existingClient = Client::where('phone', $phone)
                        ->where('user_id', $user->id)
                        ->first();

                    if ($existingClient) {
                        // Mettre à jour les informations
                        $updated += $this->updateExistingClient($existingClient, $contact);
                    } else {
                        // Créer un nouveau client
                        $this->createNewClient($contact, $phone, $user->id);
                        $imported++;
                    }
                } catch (\Exception $e) {
                    Log::error('Erreur lors de l\'importation d\'un contact CSV: ' . $e->getMessage(), [
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
            Log::error('Erreur lors de l\'importation CSV: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Importer des contacts simples (nom + téléphone)
     * Format attendu: JSON array avec des objets {name: "Nom", phone: "Téléphone"}
     */
    public function store(Request $request)
    {
        try {
            Log::info('Début de l\'importation simple de clients', [
                'user_id' => Auth::id(),
                'ip' => $request->ip()
            ]);
            
            $request->validate([
                'contacts' => 'required|json',
            ]);

            $user = Auth::user();

            // Récupérer les informations d'abonnement pour vérifier les limites
            $subscription = $this->getUserSubscription($user);
            $currentClientCount = $subscription['clientsCount'];
            $clientLimit = $subscription['clientsLimit'];
            
            Log::info('Validation de l\'importation simple', [
                'user_id' => $user->id,
                'plan' => $subscription['plan'],
                'clientsCount' => $currentClientCount,
                'clientsLimit' => $clientLimit
            ]);

            $contacts = json_decode($request->contacts, true);

            if (!is_array($contacts)) {
                Log::error('Format de contacts invalide', [
                    'user_id' => $user->id,
                    'contacts_raw' => $request->contacts,
                    'json_error' => json_last_error_msg()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Format de contacts invalide'
                ], 422);
            }
            
            Log::info('Contacts à importer', [
                'contacts_count' => count($contacts)
            ]);

            // Vérifier si l'importation dépasserait la limite
            if ($currentClientCount + count($contacts) > $clientLimit) {
                Log::warning('Limite de clients dépassée pour importation simple', [
                    'user_id' => $user->id,
                    'current_count' => $currentClientCount,
                    'to_import' => count($contacts),
                    'limit' => $clientLimit
                ]);
                return response()->json([
                    'success' => false,
                    'message' => "L'importation dépasserait la limite de clients pour votre plan (" . $clientLimit . ")."
                ], 403);
            }

            $imported = 0;
            $updated = 0;
            $errors = [];

            foreach ($contacts as $index => $contact) {
                try {
                    // Validation de base de chaque contact
                    if (empty($contact['name']) || empty($contact['phone'])) {
                        Log::warning('Contact invalide dans l\'importation simple', [
                            'index' => $index,
                            'contact' => $contact
                        ]);
                        $errors[] = "Contact #" . ($index + 1) . ": Nom ou téléphone manquant";
                        continue;
                    }

                    // Nettoyer le numéro de téléphone
                    $phone = $this->normalizePhoneNumber($contact['phone']);
                    
                    Log::debug('Traitement du contact', [
                        'index' => $index,
                        'name' => $contact['name'],
                        'phone' => $phone
                    ]);

                    // Vérifier si le client existe déjà
                    $existingClient = Client::where('phone', $phone)
                        ->where('user_id', $user->id)
                        ->first();

                    if ($existingClient) {
                        // Mise à jour du nom si nécessaire
                        if ($existingClient->name !== $contact['name']) {
                            $existingClient->name = $contact['name'];
                            $existingClient->save();
                            $updated++;
                            Log::info('Client existant mis à jour', [
                                'client_id' => $existingClient->id,
                                'name' => $existingClient->name,
                                'phone' => $existingClient->phone
                            ]);
                        } else {
                            Log::info('Client existant sans modification', [
                                'client_id' => $existingClient->id,
                                'phone' => $existingClient->phone
                            ]);
                        }
                    } else {
                        // Créer un nouveau client
                        $client = new Client([
                            'user_id' => $user->id,
                            'name' => $contact['name'],
                            'phone' => $phone
                        ]);
                        $client->save();
                        $imported++;
                        Log::info('Nouveau client créé', [
                            'client_id' => $client->id,
                            'name' => $client->name,
                            'phone' => $client->phone
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Erreur lors du traitement d\'un contact simple', [
                        'index' => $index,
                        'contact' => $contact,
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine()
                    ]);
                    $errors[] = "Contact #" . ($index + 1) . ": " . $e->getMessage();
                }
            }
            
            Log::info('Résumé de l\'importation simple', [
                'user_id' => $user->id,
                'imported' => $imported,
                'updated' => $updated,
                'errors' => count($errors)
            ]);

            return response()->json([
                'success' => true,
                'message' => "Importation terminée. $imported contacts importés, $updated mis à jour.",
                'imported' => $imported,
                'updated' => $updated,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur générale lors de l\'importation simple', [
                'user_id' => Auth::id() ?? 'non authentifié',
                'error' => $e->getMessage(),
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Parser une ligne CSV en tenant compte des guillemets
     */
    private function parseCsvLine($line)
    {
        $result = [];
        $current = '';
        $inQuotes = false;
        $length = strlen($line);

        for ($i = 0; $i < $length; $i++) {
            $char = $line[$i];

            if ($char === '"') {
                if ($inQuotes && $i + 1 < $length && $line[$i + 1] === '"') {
                    $current .= '"';
                    $i++; // Skip next quote
                } else {
                    $inQuotes = !$inQuotes;
                }
            } elseif ($char === ',' && !$inQuotes) {
                $result[] = trim($current);
                $current = '';
            } else {
                $current .= $char;
            }
        }

        $result[] = trim($current);
        return $result;
    }

    /**
     * Créer un nouveau client
     */
    private function createNewClient($contact, $phone, $userId)
    {
        $clientData = [
            'name' => $contact['name'],
            'phone' => $phone,
            'user_id' => $userId,
        ];

        // Ajouter les champs optionnels s'ils existent
        if (!empty($contact['email'])) {
            $clientData['email'] = $contact['email'];
        }

        if (!empty($contact['birthday'])) {
            $clientData['birthday'] = $this->parseDate($contact['birthday']);
        }

        if (!empty($contact['address'])) {
            $clientData['address'] = $contact['address'];
        }

        if (!empty($contact['notes'])) {
            $clientData['notes'] = $contact['notes'];
        }

        $client = Client::create($clientData);

        // Traiter les tags s'ils existent
        if (!empty($contact['tags'])) {
            $this->processTags($client, $contact['tags'], $userId);
        }

        return $client;
    }

    /**
     * Mettre à jour un client existant
     */
    private function updateExistingClient($client, $contact)
    {
        $updated = false;

        if ($client->name !== $contact['name']) {
            $client->name = $contact['name'];
            $updated = true;
        }

        if (!empty($contact['email']) && $client->email !== $contact['email']) {
            $client->email = $contact['email'];
            $updated = true;
        }

        if (!empty($contact['birthday'])) {
            $parsedDate = $this->parseDate($contact['birthday']);
            if ($parsedDate && $client->birthday !== $parsedDate) {
                $client->birthday = $parsedDate;
                $updated = true;
            }
        }

        if (!empty($contact['address']) && $client->address !== $contact['address']) {
            $client->address = $contact['address'];
            $updated = true;
        }

        if (!empty($contact['notes']) && $client->notes !== $contact['notes']) {
            $client->notes = $contact['notes'];
            $updated = true;
        }

        if ($updated) {
            $client->save();
        }

        // Traiter les tags s'ils existent
        if (!empty($contact['tags'])) {
            $this->processTags($client, $contact['tags'], $client->user_id);
        }

        return $updated ? 1 : 0;
    }

    /**
     * Traiter les tags
     */
    private function processTags($client, $tagsString, $userId)
    {
        $tagNames = array_map('trim', explode(',', $tagsString));
        $tagIds = [];

        foreach ($tagNames as $tagName) {
            if (!empty($tagName)) {
                $tag = Tag::firstOrCreate([
                    'name' => $tagName,
                    'user_id' => $userId
                ]);
                $tagIds[] = $tag->id;
            }
        }

        if (!empty($tagIds)) {
            $client->tags()->sync($tagIds);
        }
    }

    /**
     * Parser une date dans différents formats
     */
    private function parseDate($dateString)
    {
        $formats = [
            'Y-m-d',
            'd/m/Y',
            'm/d/Y',
            'd-m-Y',
            'm-d-Y',
            'Y/m/d',
            'Y-m-d H:i:s',
            'd/m/Y H:i:s'
        ];

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $dateString);
            if ($date !== false) {
                return $date->format('Y-m-d');
            }
        }

        return null;
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
