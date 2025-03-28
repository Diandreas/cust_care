<?php

namespace App\Exports;

use App\Models\Client;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ClientsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithTitle, WithEvents
{
    protected $clients;
    protected $fields;
    protected $dateFormat;

    public function __construct($clients, $fields = null, $dateFormat = 'd/m/Y')
    {
        $this->clients = $clients;
        $this->fields = $fields ?? ['name', 'phone', 'email', 'birthday', 'address', 'notes', 'tags', 'lastContact', 'totalSmsCount'];
        $this->dateFormat = $dateFormat;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        return $this->clients;
    }

    /**
     * @return string
     */
    public function title(): string
    {
        return 'Clients';
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        $headings = [];
        
        if (in_array('name', $this->fields)) $headings[] = 'Nom';
        if (in_array('phone', $this->fields)) $headings[] = 'Téléphone';
        if (in_array('email', $this->fields)) $headings[] = 'Email';
        if (in_array('birthday', $this->fields)) $headings[] = 'Anniversaire';
        if (in_array('address', $this->fields)) $headings[] = 'Adresse';
        if (in_array('notes', $this->fields)) $headings[] = 'Notes';
        if (in_array('tags', $this->fields)) $headings[] = 'Tags';
        if (in_array('lastContact', $this->fields)) $headings[] = 'Dernier contact';
        if (in_array('totalSmsCount', $this->fields)) $headings[] = 'Nombre de SMS';
        if (in_array('created_at', $this->fields)) $headings[] = 'Date d\'ajout';
        
        return $headings;
    }

    /**
     * @param mixed $client
     * @return array
     */
    public function map($client): array
    {
        $row = [];
        
        // Gérer les tags avec soin
        $tags = $client->relationLoaded('tags') && $client->tags->count() > 0 
            ? $client->tags->pluck('name')->implode(', ') 
            : '';
        
        // Gérer les dates
        $birthday = $client->birthday 
            ? date($this->dateFormat, strtotime($client->birthday)) 
            : '';
            
        $lastContact = value(function() use ($client) {
            if (isset($client->lastContact) && $client->lastContact) {
                return date($this->dateFormat, strtotime($client->lastContact));
            }
            
            if ($client->relationLoaded('messages') && $client->messages->count() > 0) {
                $latestMessage = $client->messages->sortByDesc('created_at')->first();
                return $latestMessage ? date($this->dateFormat, strtotime($latestMessage->created_at)) : '';
            }
            
            return '';
        });
        
        $createdAt = $client->created_at 
            ? date($this->dateFormat, strtotime($client->created_at)) 
            : '';
        
        // Construire la ligne en fonction des champs sélectionnés
        if (in_array('name', $this->fields)) $row[] = $client->name ?? '';
        if (in_array('phone', $this->fields)) $row[] = $client->phone ?? '';
        if (in_array('email', $this->fields)) $row[] = $client->email ?? '';
        if (in_array('birthday', $this->fields)) $row[] = $birthday;
        if (in_array('address', $this->fields)) $row[] = $client->address ?? '';
        if (in_array('notes', $this->fields)) $row[] = $client->notes ?? '';
        if (in_array('tags', $this->fields)) $row[] = $tags;
        if (in_array('lastContact', $this->fields)) $row[] = $lastContact;
        if (in_array('totalSmsCount', $this->fields)) $row[] = $client->totalSmsCount ?? ($client->messages_count ?? 0);
        if (in_array('created_at', $this->fields)) $row[] = $createdAt;
        
        return $row;
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            // Style pour la première ligne (en-têtes)
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => '0D1D40']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'color' => ['rgb' => 'E9EFFB']
                ]
            ],
        ];
    }
    
    /**
     * @return array
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                // Fixer la première ligne
                $event->sheet->getDelegate()->freezePane('A2');
                
                // Ajouter des bordures au tableau
                $lastColumn = $event->sheet->getHighestColumn();
                $lastRow = $event->sheet->getHighestRow();
                
                $event->sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray([
                    'borders' => [
                        'bottom' => [
                            'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                            'color' => ['rgb' => '0D1D40'],
                        ],
                    ],
                ]);
                
                // Ajouter un filtre automatique
                $event->sheet->setAutoFilter('A1:' . $lastColumn . '1');
                
                // Centrer certaines colonnes
                $headers = $this->headings();
                $columnIndex = 0;
                
                foreach ($headers as $key => $header) {
                    $column = chr(65 + $columnIndex); // Convertir l'index en lettre (A, B, C, etc.)
                    
                    // Centrer les colonnes numériques et de dates
                    if (in_array($header, ['Téléphone', 'Anniversaire', 'Dernier contact', 'Nombre de SMS', 'Date d\'ajout'])) {
                        $event->sheet->getStyle($column . '1:' . $column . $lastRow)->getAlignment()
                            ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
                    }
                    
                    $columnIndex++;
                }
            },
        ];
    }
}