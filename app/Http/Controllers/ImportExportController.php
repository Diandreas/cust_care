<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Tag;
use App\Exports\ClientsExport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class ImportExportController extends Controller
{
    /**
     * Importer des clients à partir d'un fichier CSV ou Excel
     */
    public function import(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:csv,txt,xls,xlsx|max:5120', // 5MB max
                'mapping' => 'required|json'
            ]);

            $user = Auth::user();
            $subscription = $this->getUserSubscription($user);
            $currentClientCount = $subscription['clientsCount'];
            $clientLimit = $subscription['clientsLimit'];

            $mapping = json_decode($request->mapping, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur dans le format du mapping JSON'
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

            // Traiter l'importation en une seule transaction
            try {
                DB::beginTransaction();

                $file = $request->file('file');
                $extension = strtolower($file->getClientOriginalExtension());

                if (in_array($extension, ['csv', 'txt'])) {
                    $result = $this->importFromCsv($file, $mapping);
                } else {
                    $result = $this->importFromExcel($file, $mapping);
                }

                // Vérifier si l'importation dépasserait la limite
                if ($currentClientCount + $result['toImport'] > $clientLimit) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "L'importation dépasserait la limite de clients pour votre plan ({$clientLimit})."
                    ], 403);
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => "Importation terminée. {$result['imported']} contacts importés, {$result['updated']} mis à jour.",
                    'imported' => $result['imported'],
                    'updated' => $result['updated'],
                    'errors' => $result['errors'] ?? []
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Erreur lors de l\'importation: ' . $e->getMessage());
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Erreur d\'importation: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter des clients au format CSV ou Excel
     */
    public function export(Request $request)
    {
        try {
            $query = Auth::user()->clients()->with('tags');

            // Appliquer les filtres
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->has('tag_id') && $request->tag_id) {
                $query->whereHas('tags', function($q) use ($request) {
                    $q->where('tags.id', $request->tag_id);
                });
            }

            // Clients sélectionnés explicitement
            if ($request->has('selected') && is_array($request->selected) && count($request->selected) > 0) {
                $query->whereIn('id', $request->selected);
            }

            $clients = $query->get();

            $format = $request->input('format', 'csv');
            $fileName = 'clients_' . Carbon::now()->format('Y-m-d') . '.' . $format;

            // Les champs à exporter (par défaut)
            $fields = ['name', 'phone', 'email', 'birthday', 'address', 'notes', 'tags', 'lastContact', 'totalSmsCount'];

            if ($format === 'excel') {
                return Excel::download(new ClientsExport($clients, $fields), $fileName, \Maatwebsite\Excel\Excel::XLSX);
            } else {
                return Excel::download(new ClientsExport($clients, $fields), $fileName, \Maatwebsite\Excel\Excel::CSV);
            }
        } catch (\Exception $e) {
            Log::error('Erreur d\'exportation: ' . $e->getMessage());

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'exportation: ' . $e->getMessage()
                ], 500);
            }

            return back()->withErrors(['export' => 'Une erreur est survenue lors de l\'exportation']);
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
     * Méthode pour importer depuis un CSV
     */
    private function importFromCsv($file, $mapping)
    {
        // Lire le fichier avec l'encodage approprié
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
            throw new \Exception('Le fichier CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
        }

        // Parser la ligne d'en-tête
        $headers = $this->parseCsvLine($lines[0]);

        $imported = 0;
        $updated = 0;
        $errors = [];
        $toImport = 0;

        // Compter d'abord les lignes valides
        for ($i = 1; $i < count($lines); $i++) {
            $values = $this->parseCsvLine($lines[$i]);
            $row = [];

            foreach ($headers as $index => $header) {
                if (isset($mapping[$header]) && $mapping[$header] !== 'ignore') {
                    $row[$mapping[$header]] = isset($values[$index]) ? trim($values[$index]) : '';
                }
            }

            if (!empty($row['name']) && !empty($row['phone'])) {
                $toImport++;
            }
        }

        // Traiter les lignes
        for ($i = 1; $i < count($lines); $i++) {
            try {
                $values = $this->parseCsvLine($lines[$i]);
                $row = [];

                foreach ($headers as $index => $header) {
                    if (isset($mapping[$header]) && $mapping[$header] !== 'ignore') {
                        $row[$mapping[$header]] = isset($values[$index]) ? trim($values[$index]) : '';
                    }
                }

                if (empty($row['name']) || empty($row['phone'])) {
                    $errors[] = "Ligne " . ($i + 1) . ": Nom ou téléphone manquant";
                    continue;
                }

                $result = $this->processClientRow($row);
                if ($result['action'] === 'created') {
                    $imported++;
                } elseif ($result['action'] === 'updated') {
                    $updated++;
                }

            } catch (\Exception $e) {
                $errors[] = "Ligne " . ($i + 1) . ": " . $e->getMessage();
            }
        }

        return [
            'imported' => $imported,
            'updated' => $updated,
            'errors' => $errors,
            'toImport' => $toImport
        ];
    }

    /**
     * Méthode pour importer depuis Excel (si vous avez la librairie Excel)
     */
    private function importFromExcel($file, $mapping)
    {
        // Cette méthode nécessite la librairie maatwebsite/excel
        // Si vous ne l'avez pas, renvoyez une erreur
        throw new \Exception('L\'importation Excel n\'est pas encore supportée. Veuillez utiliser un fichier CSV.');
    }

    /**
     * Traiter une ligne d'importation
     */
    private function processClientRow($row)
    {
        $data = [
            'user_id' => Auth::id(),
            'name' => $row['name'] ?? '',
            'phone' => $this->normalizePhoneNumber($row['phone'] ?? ''),
            'email' => !empty($row['email']) ? $row['email'] : null,
            'birthday' => !empty($row['birthday']) ? $this->formatDate($row['birthday']) : null,
            'address' => !empty($row['address']) ? $row['address'] : null,
            'notes' => !empty($row['notes']) ? $row['notes'] : null,
        ];

        // Vérifier si le client existe
        $existingClient = Client::where('phone', $data['phone'])
            ->where('user_id', Auth::id())
            ->first();

        if ($existingClient) {
            // Mettre à jour le client existant
            $hasChanges = false;
            foreach (['name', 'email', 'birthday', 'address', 'notes'] as $field) {
                if ($data[$field] !== null && $existingClient->$field !== $data[$field]) {
                    $existingClient->$field = $data[$field];
                    $hasChanges = true;
                }
            }

            if ($hasChanges) {
                $existingClient->save();
            }

            $client = $existingClient;
            $action = $hasChanges ? 'updated' : 'unchanged';
        } else {
            // Créer un nouveau client
            $client = Client::create($data);
            $action = 'created';
        }

        // Traiter les tags
        if (!empty($row['tags'])) {
            $this->processTags($client, $row['tags']);
        }

        return ['client' => $client, 'action' => $action];
    }

    /**
     * Traiter les tags
     */
    private function processTags($client, $tagsString)
    {
        $tagNames = array_map('trim', explode(',', $tagsString));
        $tagIds = [];

        foreach ($tagNames as $tagName) {
            if (!empty($tagName)) {
                $tag = Tag::firstOrCreate([
                    'name' => $tagName,
                    'user_id' => Auth::id()
                ]);
                $tagIds[] = $tag->id;
            }
        }

        if (!empty($tagIds)) {
            $client->tags()->syncWithoutDetaching($tagIds);
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
     * Convertir une date en format Y-m-d
     */
    private function formatDate($dateString)
    {
        if (empty($dateString)) {
            return null;
        }

        // Essayer quelques formats courants
        $formats = ['Y-m-d', 'd/m/Y', 'm/d/Y', 'd-m-Y', 'm-d-Y', 'Y/m/d'];

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $dateString);
            if ($date && $date->format($format) === $dateString) {
                return $date->format('Y-m-d');
            }
        }

        // Essayer avec Carbon en dernier recours
        try {
            return Carbon::parse($dateString)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
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
