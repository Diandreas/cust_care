<?php

namespace App\Imports;

use App\Models\Client;
use App\Models\Category;
use App\Models\Tag;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ClientsImport implements ToModel, WithHeadingRow
{
    protected $mapping;
    protected $userId;
    protected $categoriesCache = [];
    protected $tagsCache = [];

    public function __construct(array $mapping, int $userId)
    {
        $this->mapping = $mapping;
        $this->userId = $userId;
        
        // Précharger les catégories et tags pour éviter de multiples requêtes
        $this->preloadCategories();
        $this->preloadTags();
    }

    private function preloadCategories()
    {
        $categories = Category::where('user_id', $this->userId)->get();
        foreach ($categories as $category) {
            $key = Str::slug(strtolower($category->name));
            $this->categoriesCache[$key] = $category->id;
        }
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
                'category_id' => null,
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
                        $data[$appColumn] = null;
                    }
                } elseif ($appColumn === 'category') {
                    $data['category_id'] = $this->resolveCategoryId($value);
                } elseif ($appColumn === 'tags') {
                    $tags = $this->resolveTagIds($value);
                }
            }

            // Vérifier les données obligatoires
            if (empty($data['name']) || empty($data['phone'])) {
                return null;
            }

            // Vérifier si le client existe déjà (par téléphone)
            $existingClient = Client::where('phone', $data['phone'])
                                    ->where('user_id', $this->userId)
                                    ->first();

            if ($existingClient) {
                // Mettre à jour le client existant
                $existingClient->update($data);
                
                // Synchroniser les tags si nécessaire
                if (!empty($tags)) {
                    $existingClient->tags()->sync($tags, false); // false pour ne pas détacher les tags existants
                }
                
                return null; // Retourner null car on a déjà mis à jour le client manuellement
            }

            // Créer un nouveau client
            $client = new Client($data);
            $client->save();
            
            // Attacher les tags après la sauvegarde
            if (!empty($tags)) {
                $client->tags()->attach($tags);
            }
            
            return null; // On a déjà sauvegardé le client manuellement
            
        } catch (\Exception $e) {
            Log::error('Erreur dans l\'importation du client: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'row' => json_encode($row)
            ]);
            return null;
        }
    }

    /**
     * Convertir la date en format Y-m-d
     */
    private function formatDate($dateString)
    {
        // Tester différents formats de date
        $formats = [
            'd/m/Y', 'm/d/Y', 'Y-m-d', 'd-m-Y', 'm-d-Y',
            'd.m.Y', 'm.d.Y', 'Y.m.d',
            'j F Y', 'F j Y', 'Y F j'
        ];

        foreach ($formats as $format) {
            $date = \DateTime::createFromFormat($format, $dateString);
            if ($date !== false && $date->format($format) === $dateString) {
                return $date->format('Y-m-d');
            }
        }

        // Essayer avec Carbon qui est plus flexible
        try {
            return Carbon::parse($dateString)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Récupérer ou créer l'ID de catégorie
     */
    private function resolveCategoryId($categoryName)
    {
        if (empty($categoryName)) {
            return null;
        }

        $key = Str::slug(strtolower($categoryName));

        // Vérifier si la catégorie est dans le cache
        if (isset($this->categoriesCache[$key])) {
            return $this->categoriesCache[$key];
        }

        // Chercher ou créer la catégorie
        $category = Category::firstOrCreate(
            ['name' => $categoryName, 'user_id' => $this->userId]
        );

        // Ajouter au cache
        $this->categoriesCache[$key] = $category->id;

        return $category->id;
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
}