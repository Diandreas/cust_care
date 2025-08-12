<?php

namespace App\Http\Controllers;

use App\Models\MarketingClient;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MarketingClientController extends Controller
{
    protected $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Afficher la liste des clients
     */
    public function index(Request $request)
    {
        $query = MarketingClient::where('user_id', auth()->id())
            ->with(['messages' => function ($query) {
                $query->latest()->take(5);
            }]);

        // Filtres
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('tags')) {
            $query->whereJsonContains('tags', $request->tags);
        }

        $clients = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Marketing/Clients/Index', [
            'clients' => $clients,
            'filters' => $request->only(['search', 'status', 'tags'])
        ]);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        return Inertia::render('Marketing/Clients/Create');
    }

    /**
     * Stocker un nouveau client
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'birthday' => 'nullable|date',
            'preferences' => 'nullable|array',
            'tags' => 'nullable|array',
            'custom_fields' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $client = MarketingClient::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'birthday' => $request->birthday,
            'preferences' => $request->preferences ?? [],
            'tags' => $request->tags ?? [],
            'custom_fields' => $request->custom_fields ?? [],
            'status' => 'active',
        ]);

        return redirect()->route('marketing.clients.index')
            ->with('success', 'Client créé avec succès.');
    }

    /**
     * Afficher un client spécifique
     */
    public function show(MarketingClient $client)
    {
        $this->authorize('view', $client);

        $client->load(['messages' => function ($query) {
            $query->latest()->paginate(20);
        }]);

        return Inertia::render('Marketing/Clients/Show', [
            'client' => $client
        ]);
    }

    /**
     * Afficher le formulaire de modification
     */
    public function edit(MarketingClient $client)
    {
        $this->authorize('update', $client);

        return Inertia::render('Marketing/Clients/Edit', [
            'client' => $client
        ]);
    }

    /**
     * Mettre à jour un client
     */
    public function update(Request $request, MarketingClient $client)
    {
        $this->authorize('update', $client);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'required|string|max:20',
            'birthday' => 'nullable|date',
            'preferences' => 'nullable|array',
            'tags' => 'nullable|array',
            'custom_fields' => 'nullable|array',
            'status' => 'required|in:active,inactive,opted_out',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $client->update($request->all());

        return redirect()->route('marketing.clients.index')
            ->with('success', 'Client mis à jour avec succès.');
    }

    /**
     * Supprimer un client
     */
    public function destroy(MarketingClient $client)
    {
        $this->authorize('delete', $client);

        $client->delete();

        return redirect()->route('marketing.clients.index')
            ->with('success', 'Client supprimé avec succès.');
    }

    /**
     * Envoyer un message à un client
     */
    public function sendMessage(Request $request, MarketingClient $client)
    {
        $this->authorize('view', $client);

        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:1000',
            'use_ai' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            $result = $this->whatsappService->sendMessage(
                $client,
                $request->message,
                [
                    'use_ai' => $request->use_ai,
                    'user_id' => auth()->id(),
                ]
            );

            return back()->with('success', 'Message envoyé avec succès.');
        } catch (\Exception $e) {
            return back()->withErrors(['message' => 'Erreur lors de l\'envoi du message: ' . $e->getMessage()]);
        }
    }

    /**
     * Importer des clients depuis un fichier
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,xlsx,xls|max:2048',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            DB::beginTransaction();

            $file = $request->file('file');
            $extension = $file->getClientOriginalExtension();

            if ($extension === 'csv') {
                $this->importFromCsv($file);
            } else {
                $this->importFromExcel($file);
            }

            DB::commit();

            return back()->with('success', 'Import des clients réussi.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['import' => 'Erreur lors de l\'import: ' . $e->getMessage()]);
        }
    }

    /**
     * Exporter les clients
     */
    public function export(Request $request)
    {
        $query = MarketingClient::where('user_id', auth()->id());

        // Appliquer les mêmes filtres que l'index
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $clients = $query->get();

        $filename = 'clients-marketing-' . date('Y-m-d') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($clients) {
            $file = fopen('php://output', 'w');
            
            // En-têtes
            fputcsv($file, ['ID', 'Nom', 'Email', 'Téléphone', 'Anniversaire', 'Statut', 'Tags', 'Créé le']);
            
            // Données
            foreach ($clients as $client) {
                fputcsv($file, [
                    $client->id,
                    $client->name,
                    $client->email,
                    $client->phone,
                    $client->birthday,
                    $client->status,
                    implode(', ', $client->tags ?? []),
                    $client->created_at->format('Y-m-d H:i:s')
                ]);
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Actions en masse sur les clients
     */
    public function bulkAction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:send_message,add_tags,remove_tags,change_status,delete',
            'client_ids' => 'required|array|min:1',
            'client_ids.*' => 'exists:marketing_clients,id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        $clients = MarketingClient::whereIn('id', $request->client_ids)
            ->where('user_id', auth()->id())
            ->get();

        try {
            switch ($request->action) {
                case 'send_message':
                    $this->bulkSendMessage($clients, $request->message);
                    break;
                case 'add_tags':
                    $this->bulkAddTags($clients, $request->tags);
                    break;
                case 'remove_tags':
                    $this->bulkRemoveTags($clients, $request->tags);
                    break;
                case 'change_status':
                    $this->bulkChangeStatus($clients, $request->status);
                    break;
                case 'delete':
                    $this->bulkDelete($clients);
                    break;
            }

            return back()->with('success', 'Action en masse exécutée avec succès.');
        } catch (\Exception $e) {
            return back()->withErrors(['bulk_action' => 'Erreur lors de l\'action en masse: ' . $e->getMessage()]);
        }
    }

    /**
     * Gérer l'opt-out d'un client
     */
    public function optOut(MarketingClient $client)
    {
        $this->authorize('update', $client);

        $client->optOut();

        return back()->with('success', 'Client désabonné avec succès.');
    }

    /**
     * Gérer l'opt-in d'un client
     */
    public function optIn(MarketingClient $client)
    {
        $this->authorize('update', $client);

        $client->optIn();

        return back()->with('success', 'Client réabonné avec succès.');
    }

    /**
     * Importer depuis un fichier CSV
     */
    private function importFromCsv($file)
    {
        $handle = fopen($file->getPathname(), 'r');
        $headers = fgetcsv($handle);
        
        while (($data = fgetcsv($handle)) !== false) {
            $row = array_combine($headers, $data);
            
            $this->createClientFromImport($row);
        }
        
        fclose($handle);
    }

    /**
     * Importer depuis un fichier Excel
     */
    private function importFromExcel($file)
    {
        // Implémenter l'import Excel si nécessaire
        // Utiliser une bibliothèque comme PhpSpreadsheet
        throw new \Exception('Import Excel non encore implémenté');
    }

    /**
     * Créer un client depuis les données d'import
     */
    private function createClientFromImport($row)
    {
        $clientData = [
            'user_id' => auth()->id(),
            'name' => $row['name'] ?? $row['nom'] ?? '',
            'email' => $row['email'] ?? $row['mail'] ?? '',
            'phone' => $row['phone'] ?? $row['telephone'] ?? $row['tel'] ?? '',
            'birthday' => $row['birthday'] ?? $row['anniversaire'] ?? null,
            'status' => 'active',
        ];

        // Nettoyer et valider les données
        if (empty($clientData['name']) || empty($clientData['phone'])) {
            return; // Ignorer les lignes invalides
        }

        // Vérifier si le client existe déjà
        $existingClient = MarketingClient::where('user_id', auth()->id())
            ->where('phone', $clientData['phone'])
            ->first();

        if (!$existingClient) {
            MarketingClient::create($clientData);
        }
    }

    /**
     * Envoyer un message en masse
     */
    private function bulkSendMessage($clients, $message)
    {
        foreach ($clients as $client) {
            try {
                $this->whatsappService->sendMessage($client, $message, [
                    'user_id' => auth()->id(),
                    'bulk_send' => true
                ]);
            } catch (\Exception $e) {
                // Logger l'erreur mais continuer avec les autres clients
                \Log::error("Erreur lors de l'envoi en masse au client {$client->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Ajouter des tags en masse
     */
    private function bulkAddTags($clients, $tags)
    {
        foreach ($clients as $client) {
            foreach ($tags as $tag) {
                $client->addTag($tag);
            }
        }
    }

    /**
     * Supprimer des tags en masse
     */
    private function bulkRemoveTags($clients, $tags)
    {
        foreach ($clients as $client) {
            foreach ($tags as $tag) {
                $client->removeTag($tag);
            }
        }
    }

    /**
     * Changer le statut en masse
     */
    private function bulkChangeStatus($clients, $status)
    {
        MarketingClient::whereIn('id', $clients->pluck('id'))
            ->update(['status' => $status]);
    }

    /**
     * Supprimer en masse
     */
    private function bulkDelete($clients)
    {
        MarketingClient::whereIn('id', $clients->pluck('id'))->delete();
    }
}