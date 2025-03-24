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
        // Obtenir les tags formatés
        $tags = $client->tags ? $client->tags->pluck('name')->implode(', ') : '';

        // Calculer le nombre de SMS
        $smsCount = $client->messages_count ?? $client->messages()->count();

        // Formater la date du dernier contact
        $lastContact = $client->last_message_date ?? $client->messages()->max('created_at');

        return [
            $client->name,
            $client->phone,
            $client->email,
            $client->category ? $client->category->name : '',
            $client->birthday ? date('d/m/Y', strtotime($client->birthday)) : '',
            $client->address,
            $client->notes,
            $tags,
            $client->created_at ? date('d/m/Y', strtotime($client->created_at)) : '',
            $lastContact ? date('d/m/Y', strtotime($lastContact)) : '',
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