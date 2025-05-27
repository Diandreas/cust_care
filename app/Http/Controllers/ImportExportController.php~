<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Tag;
use App\Exports\ClientsExport;
use App\Imports\ClientsImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
                'file' => 'required|file|mimes:csv,txt,xls,xlsx',
                'mapping' => 'required|json'
            ]);
            
            $user = Auth::user();
            $subscription = $this->getUserSubscription($user);
            $currentClientCount = $subscription['clientsCount'];
            $clientLimit = $subscription['clientsLimit'];
            
            // Analyser d'abord le fichier pour estimer le nombre de lignes
            $fileContent = file_get_contents($request->file('file')->getRealPath());
            $rowCount = substr_count($fileContent, "\n");
            
            // Vérifier si l'importation dépasserait la limite
            if ($currentClientCount + $rowCount > $clientLimit) {
                return response()->json([
                    'success' => false,
                    'message' => "L'importation dépasserait la limite de clients pour votre plan."
                ], 403);
            }
            
            $mapping = json_decode($request->mapping, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Erreur dans le format du mapping JSON');
            }
            
            // Traiter l'importation en une seule transaction
            try {
                DB::beginTransaction();
                
                // Pour CSV simple, on peut l'analyser manuellement
                if ($request->file('file')->getClientOriginalExtension() === 'csv') {
                    $imported = $this->importFromCsv($request->file('file'), $mapping);
                } else {
                    // Pour Excel, utiliser la bibliothèque Excel
                    $importer = new ClientsImport($mapping, Auth::id());
                    $importer->import($request->file('file'));
                    $imported = $importer->getImportedCount();
                }
                
                DB::commit();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Les clients ont été importés avec succès.',
                    'imported' => $imported
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
     * Méthode pour importer depuis un CSV
     */
    private function importFromCsv($file, $mapping)
    {
        $handle = fopen($file->getRealPath(), 'r');
        $headers = fgetcsv($handle);
        $imported = 0;
        
        while (($data = fgetcsv($handle)) !== false) {
            $row = [];
            foreach ($headers as $index => $header) {
                if (isset($data[$index])) {
                    $row[$header] = $data[$index];
                }
            }
            
            $this->processClientRow($row, $mapping);
            $imported++;
        }
        
        fclose($handle);
        return $imported;
    }
    
    /**
     * Traiter une ligne d'importation
     */
    private function processClientRow($row, $mapping)
    {
        $data = [
            'user_id' => Auth::id(),
            'name' => '',
            'phone' => '',
            'email' => null,
            'birthday' => null,
            'address' => null,
            'notes' => null,
        ];
        
        $tags = [];
        
        // Appliquer le mapping
        foreach ($mapping as $csvColumn => $appColumn) {
            if (empty($appColumn) || !isset($row[$csvColumn])) {
                continue;
            }
            
            $value = $row[$csvColumn];
            
            if ($appColumn === 'name' || $appColumn === 'phone' || $appColumn === 'email' || 
                $appColumn === 'address' || $appColumn === 'notes') {
                $data[$appColumn] = $value;
            } elseif ($appColumn === 'birthday') {
                try {
                    $data[$appColumn] = $this->formatDate($value);
                } catch (\Exception $e) {
                    $data[$appColumn] = null;
                }
            } elseif ($appColumn === 'tags') {
                $tagNames = explode(',', $value);
                foreach ($tagNames as $tagName) {
                    $tagName = trim($tagName);
                    if (!empty($tagName)) {
                        $tag = Tag::firstOrCreate([
                            'name' => $tagName,
                            'user_id' => Auth::id()
                        ]);
                        $tags[] = $tag->id;
                    }
                }
            }
        }
        
        // Vérifier les données obligatoires
        if (empty($data['name']) || empty($data['phone'])) {
            return;
        }
        
        // Vérifier si le client existe
        $existingClient = Client::where('phone', $data['phone'])
                                ->where('user_id', Auth::id())
                                ->first();
        
        if ($existingClient) {
            $existingClient->update($data);
            if (!empty($tags)) {
                $existingClient->tags()->syncWithoutDetaching($tags);
            }
        } else {
            $client = new Client($data);
            $client->save();
            if (!empty($tags)) {
                $client->tags()->attach($tags);
            }
        }
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
        $formats = ['d/m/Y', 'm/d/Y', 'Y-m-d', 'd-m-Y'];
        
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
        $plan = $user->subscription?->plan ?? 'Free';
        $clientsLimit = config('app.subscription_limits.' . $plan . '.clients', 100);
        $clientsCount = $user->clients()->count();
        $smsBalance = $user->subscription?->sms_balance ?? 0;
        
        return [
            'plan' => $plan,
            'clientsLimit' => $clientsLimit,
            'clientsCount' => $clientsCount,
            'smsBalance' => $smsBalance
        ];
    }
}
