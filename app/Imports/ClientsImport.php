<?php

namespace App\Imports;

use App\Models\Client;
use App\Models\Tag;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ClientsImport implements ToModel, WithHeadingRow, WithBatchInserts, WithChunkReading
{
    protected $mapping;
    protected $userId;
    protected $tagsCache = [];
    protected $importedCount = 0;
    protected $updatedCount = 0;
    protected $skippedCount = 0;
    protected $errors = [];

    public function __construct(array $mapping, int $userId)
    {
        $this->mapping = $mapping;
        $this->userId = $userId;
        
        // Précharger les tags pour éviter de multiples requêtes
        $this->preloadTags();
    }

    /**
     * Size of batch inserts
     */
    public function batchSize(): int
    {
        return 100;
    }

    /**
     * Chunk size when reading
     */
    public function chunkSize(): int
    {
        return 200;
    }

    private function preloadTags()
    {
        $tags = Tag::where('user_id', $this->userId)->get();
        foreach ($tags as $tag) {
            $key = Str::slug(strtolower($tag->name));
            $this->tagsCache[$key] = $tag->id;
        }
    }

    /**
     * @param array $row
     *
     * @return \Illuminate\Database\Eloquent\Model|null
     */
    public function model(array $row)
    {
        try {
            // Préparer les données selon le mapping défini par l'utilisateur
            $data = [
                'user_id' => $this->userId,
                'name' => '',
                'phone' => '',
                'email' => null,
                'birthday' => null,
                'address' => null,
                'notes' => null,
            ];

            $tags = [];

            // Appliquer le mapping des colonnes
            foreach ($this->mapping as $csvColumn => $appColumn) {
                if (empty($appColumn) || !isset($row[$csvColumn])) {
                    continue;
                }

                $value = $row[$csvColumn];

                if ($appColumn === 'name' || $appColumn === 'phone' || $appColumn === 'email' || 
                    $appColumn === 'address' || $appColumn === 'notes') {
                    $data[$appColumn] = $value;
                } elseif ($appColumn === 'birthday') {
                    // Essayer de convertir le format de date
                    try {
                        $data[$appColumn] = $this->formatDate($value);
                    } catch (\Exception $e) {
                        Log::warning("Impossible de convertir la date: {$value}", [
                            'row' => json_encode($row),
                            'error' => $e->getMessage()
                        ]);
                        $data[$appColumn] = null;
                    }
                } elseif ($appColumn === 'tags') {
                    $tags = $this->resolveTagIds($value);
                }
            }

            // Vérifier les données obligatoires
            if (empty($data['name']) || empty($data['phone'])) {
                $this->skippedCount++;
                $this->errors[] = "Ligne ignorée : nom ou téléphone manquant - " . json_encode($row);
                return null;
            }

            // Normaliser le numéro de téléphone (enlever les espaces, tirets, etc.)
            $data['phone'] = $this->normalizePhoneNumber($data['phone']);

            // Vérifier si le client existe déjà (par téléphone)
            $existingClient = Client::where('phone', $data['phone'])
                                    ->where('user_id', $this->userId)
                                    ->first();

            if ($existingClient) {
                // Mettre à jour le client existant
                $existingClient->update($data);
                
                // Synchroniser les tags si nécessaire
                if (!empty($tags)) {
                    // Récupérer les tags actuels
                    $currentTags = $existingClient->tags()->pluck('tags.id')->toArray();
                    
                    // Fusionner avec les nouveaux tags sans duplications
                    $mergedTags = array_unique(array_merge($currentTags, $tags));
                    
                    // Synchroniser les tags
                    $existingClient->tags()->sync($mergedTags);
                }
                
                $this->updatedCount++;
                return null; // Retourner null car le client a été mis à jour manuellement
            }

            // Créer un nouveau client
            $client = new Client($data);
            $client->save();
            
            // Attacher les tags après la sauvegarde
            if (!empty($tags)) {
                $client->tags()->attach($tags);
            }
            
            $this->importedCount++;
            return null; // Retourner null car le client a été créé manuellement
            
        } catch (\Exception $e) {
            $this->skippedCount++;
            $this->errors[] = "Erreur lors de l'importation: " . $e->getMessage() . " - " . json_encode($row);
            
            Log::error('Erreur dans l\'importation du client: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'row' => json_encode($row)
            ]);
            
            return null;
        }
    }

    /**
     * Normaliser un numéro de téléphone
     */
    private function normalizePhoneNumber($phone)
    {
        // Supprimer tous les caractères non numériques
        $normalized = preg_replace('/[^0-9+]/', '', $phone);
        
        // S'assurer que le numéro commence par un indicatif de pays si ce n'est pas déjà le cas
        if (!Str::startsWith($normalized, '+')) {
            // Assumer le format local par défaut (à adapter selon le pays)
            if (Str::startsWith($normalized, '0')) {
                $normalized = '+33' . substr($normalized, 1); // Exemple pour la France
            } else {
                // Si pas d'indicatif et ne commence pas par 0, ajouter juste un +
                $normalized = '+' . $normalized;
            }
        }
        
        return $normalized;
    }

    /**
     * Convertir la date en format Y-m-d
     */
    private function formatDate($dateString)
    {
        // Si vide ou null, retourner null
        if (empty($dateString)) {
            return null;
        }
        
        // Liste étendue des formats à tester
        $formats = [
            'd/m/Y', 'm/d/Y', 'Y-m-d', 'd-m-Y', 'm-d-Y',
            'd.m.Y', 'm.d.Y', 'Y.m.d',
            'j F Y', 'F j Y', 'Y F j', 
            'j/n/Y', 'n/j/Y',          // Formats sans zéros
            'j-n-Y', 'n-j-Y',
            'j.n.Y', 'n.j.Y',
            'Y/m/d', 'Y/n/j'           // Formats asiatiques
        ];
        
        // Tester des formats spécifiques d'abord
        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $dateString);
            if ($date !== false && $date->format($format) === $dateString) {
                return $date->format('Y-m-d');
            }
        }
        
        // Essayer de nettoyer la chaîne si elle contient des caractères non standards
        $cleanedString = preg_replace('/[^\d\s\/\.\-]/', '', $dateString);
        if ($cleanedString !== $dateString) {
            foreach ($formats as $format) {
                $date = \DateTime::createFromFormat($format, $cleanedString);
                if ($date !== false) {
                    return $date->format('Y-m-d');
                }
            }
        }

        // Essayer avec Carbon qui est plus flexible
        try {
            return Carbon::parse($dateString)->format('Y-m-d');
        } catch (\Exception $e) {
            // Journaliser l'erreur pour debugging
            Log::warning("Impossible de convertir la date: $dateString", [
                'exception' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Récupérer ou créer les IDs de tags
     */
    private function resolveTagIds($tagsString)
    {
        if (empty($tagsString)) {
            return [];
        }

        // Séparer les tags (virgule, point-virgule ou espace)
        $tagNames = preg_split('/[,;\s]+/', $tagsString);
        $tagIds = [];

        foreach ($tagNames as $tagName) {
            $tagName = trim($tagName);
            if (empty($tagName)) continue;

            $key = Str::slug(strtolower($tagName));

            // Vérifier si le tag est dans le cache
            if (isset($this->tagsCache[$key])) {
                $tagIds[] = $this->tagsCache[$key];
                continue;
            }

            // Chercher ou créer le tag
            $tag = Tag::firstOrCreate(
                ['name' => $tagName, 'user_id' => $this->userId]
            );

            // Ajouter au cache
            $this->tagsCache[$key] = $tag->id;
            $tagIds[] = $tag->id;
        }

        return $tagIds;
    }
    
    /**
     * Retourne le nombre de clients importés
     */
    public function getImportedCount(): int
    {
        return $this->importedCount;
    }
    
    /**
     * Retourne le nombre de clients mis à jour
     */
    public function getUpdatedCount(): int
    {
        return $this->updatedCount;
    }
    
    /**
     * Retourne le nombre de lignes ignorées
     */
    public function getSkippedCount(): int
    {
        return $this->skippedCount;
    }
    
    /**
     * Retourne les erreurs d'importation
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}