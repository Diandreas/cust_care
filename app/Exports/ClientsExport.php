<?php

namespace App\Exports;

use App\Models\Client;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ClientsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $clients;

    public function __construct($clients)
    {
        $this->clients = $clients;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->clients;
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Nom',
            'Téléphone',
            'Email',
            'Catégorie',
            'Anniversaire',
            'Adresse',
            'Notes',
            'Tags',
            'Date d\'ajout',
            'Dernier contact',
            'Nombre de SMS'
        ];
    }

    /**
     * @param mixed $client
     * @return array
     */
    public function map($client): array
    {
        // Gérer les relations de manière sécurisée
        $category = $client->relationLoaded('category') && $client->category 
            ? $client->category->name 
            : '';
        
        // Gérer les relations avec collections
        $tags = $client->relationLoaded('tags') && $client->tags->count() > 0 
            ? $client->tags->pluck('name')->implode(', ') 
            : '';
        
        // Gérer les dates de manière sûre
        $birthday = $client->birthday 
            ? date('d/m/Y', strtotime($client->birthday)) 
            : '';
            
        $createdAt = $client->created_at 
            ? date('d/m/Y', strtotime($client->created_at)) 
            : '';
        
        // Gérer les champs calculés ou agrégés avec prudence
        $smsCount = $client->messages_count ?? ($client->relationLoaded('messages') 
            ? $client->messages->count() 
            : 0);
            
        // Gérer les dates calculées ou agrégées de manière sûre
        $lastContact = value(function() use ($client) {
            // Premièrement, vérifier si c'est déjà chargé comme attribut
            if (isset($client->last_message_date) && $client->last_message_date) {
                return date('d/m/Y', strtotime($client->last_message_date));
            }
            
            // Sinon, essayer de le calculer si la relation est chargée
            if ($client->relationLoaded('messages') && $client->messages->count() > 0) {
                $latestMessage = $client->messages->sortByDesc('created_at')->first();
                return $latestMessage ? date('d/m/Y', strtotime($latestMessage->created_at)) : '';
            }
            
            // Si on n'a pas la relation chargée, on peut faire une requête, mais avec précaution
            try {
                $latestDate = $client->messages()->max('created_at');
                return $latestDate ? date('d/m/Y', strtotime($latestDate)) : '';
            } catch (\Exception $e) {
                Log::warning("Erreur lors du calcul de la dernière date de contact", [
                    'client_id' => $client->id, 
                    'error' => $e->getMessage()
                ]);
                return '';
            }
        });

        return [
            $client->name ?? '',
            $client->phone ?? '',
            $client->email ?? '',
            $category,
            $birthday,
            $client->address ?? '',
            $client->notes ?? '',
            $tags,
            $createdAt,
            $lastContact,
            $smsCount
        ];
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Style pour la première ligne (en-têtes)
            1    => ['font' => ['bold' => true]],
        ];
    }
} 