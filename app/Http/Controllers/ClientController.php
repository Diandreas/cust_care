<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Category;
use App\Models\Tag;
use App\Models\Message;
use App\Models\User;
use App\Exports\ClientsExport;
use App\Imports\ClientsImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Visit;

/**
 * @property-read User $user L'utilisateur authentifié
 * @method HasMany clients() Relation avec les clients
 * @method HasMany messages() Relation avec les messages
 * @method HasMany categories() Relation avec les catégories
 * @method HasMany tags() Relation avec les tags
 */
class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Auth::user()->clients()
            ->with(['category', 'tags'])
            ->withCount('messages as totalSmsCount')
            ->withMax('messages as lastSmsDate', 'created_at')
            ->withMax('messages as lastContact', 'created_at')
            ->withMax('visits as lastVisitDate', 'visit_date')
            ->withCount('visits as visitCount');
        
        // Filtres de base
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }
        
        // Filtres avancés
        if ($request->has('tag_id') && $request->tag_id) {
            $query->whereHas('tags', function($q) use ($request) {
                $q->where('tags.id', $request->tag_id);
            });
        }
        
        if ($request->has('birthday_month') && $request->birthday_month) {
            // Utiliser strftime au lieu de MONTH pour compatibilité SQLite
            $query->whereRaw("strftime('%m', birthday) = ?", [sprintf('%02d', $request->birthday_month)]);
        }
        
        if ($request->has('date_range') && $request->date_range) {
            switch($request->date_range) {
                case 'today':
                    // Utiliser strftime au lieu de whereDate pour compatibilité SQLite
                    $today = Carbon::today()->format('Y-m-d');
                    $query->whereRaw("date(created_at) = ?", [$today]);
                    break;
                case 'this_week':
                    $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                    break;
                case 'this_month':
                    // Utiliser strftime au lieu de whereMonth/whereYear pour compatibilité SQLite
                    $query->whereRaw("strftime('%m', created_at) = ?", [sprintf('%02d', Carbon::now()->month)])
                          ->whereRaw("strftime('%Y', created_at) = ?", [Carbon::now()->year]);
                    break;
                case 'last_30_days':
                    $query->where('created_at', '>=', Carbon::now()->subDays(30));
                    break;
                case 'this_year':
                    // Utiliser strftime au lieu de whereYear pour compatibilité SQLite
                    $query->whereRaw("strftime('%Y', created_at) = ?", [Carbon::now()->year]);
                    break;
            }
        }
        
        // Tri
        $sortBy = $request->input('sort_by', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        
        $allowedSortFields = [
            'name', 'created_at', 'birthday', 'lastContact', 'totalSmsCount', 'lastVisitDate', 'visitCount'
        ];
        
        if (in_array($sortBy, $allowedSortFields)) {
            if ($sortBy === 'lastContact') {
                $query->orderBy('lastContact', $sortDirection);
            } elseif ($sortBy === 'totalSmsCount') {
                $query->orderBy('totalSmsCount', $sortDirection);
            } elseif ($sortBy === 'lastVisitDate') {
                $query->orderBy('lastVisitDate', $sortDirection);
            } elseif ($sortBy === 'visitCount') {
                $query->orderBy('visitCount', $sortDirection);
            } else {
                $query->orderBy($sortBy, $sortDirection);
            }
        } else {
            $query->orderBy('name', 'asc');
        }
        
        $clients = $query->paginate(10)->withQueryString();
        
        // Statistiques
        $user = Auth::user();
        $stats = [
            'totalClients' => $user->clients()->count(),
            'newClientsThisMonth' => $user->clients()
                ->whereRaw("strftime('%m', created_at) = ?", [sprintf('%02d', Carbon::now()->month)])
                ->whereRaw("strftime('%Y', created_at) = ?", [Carbon::now()->year])
                ->count(),
            'activeClientsLast30Days' => $user->clients()
                ->whereHas('messages', function($q) {
                    $q->where('created_at', '>=', Carbon::now()->subDays(30));
                })
                ->count(),
            'totalSmsSent' => $user->messages()->count(),
            'totalVisits' => $user->clients()->withCount('visits')->get()->sum('visits_count'),
            'clientsByCategory' => $user->categories()
                ->withCount('clients')
                ->get()
                ->map(function($category) {
                    return [
                        'category' => $category->name,
                        'count' => $category->clients_count
                    ];
                })
        ];
        
        // Informations d'abonnement (simulées pour l'exemple)
        $subscription = $this->getUserSubscription($user);
        
        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'categories' => $user->categories()->get(),
            'tags' => $user->tags()->get(),
            'filters' => $request->only([
                'search', 'category_id', 'tag_id', 'date_range', 
                'birthday_month', 'sort_by', 'sort_direction'
            ]),
            'stats' => $stats,
            'subscription' => $subscription
        ]);
    }
    
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
                'smsBalance' => 10 - $user->messages()->whereRaw("strftime('%m', created_at) = ?", [sprintf('%02d', Carbon::now()->month)])->count(),
                'isFreePlan' => true
            ];
        }
        
        // Simulons différents plans basés sur le nombre de clients
        if ($clientCount <= 100) {
            return [
                'plan' => 'Pack Starter',
                'clientsLimit' => 100,
                'clientsCount' => $clientCount,
                'smsBalance' => 200 - $user->messages()->whereRaw("strftime('%m', created_at) = ?", [sprintf('%02d', Carbon::now()->month)])->count(),
                'isFreePlan' => false
            ];
        } else if ($clientCount <= 500) {
            return [
                'plan' => 'Pack Business',
                'clientsLimit' => 500,
                'clientsCount' => $clientCount,
                'smsBalance' => 1000 - $user->messages()->whereRaw("strftime('%m', created_at) = ?", [sprintf('%02d', Carbon::now()->month)])->count(),
                'isFreePlan' => false
            ];
        } else {
            return [
                'plan' => 'Pack Enterprise',
                'clientsLimit' => 2000,
                'clientsCount' => $clientCount,
                'smsBalance' => 4000 - $user->messages()->whereRaw("strftime('%m', created_at) = ?", [sprintf('%02d', Carbon::now()->month)])->count(),
                'isFreePlan' => false
            ];
        }
    }
    
    // Méthode pour vérifier si l'utilisateur peut ajouter plus de clients
    private function canAddMoreClients($user)
    {
        $subscription = $this->getUserSubscription($user);
        return $subscription['clientsCount'] < $subscription['clientsLimit'];
    }
    
    public function create()
    {
        $categories = Auth::user()->categories()->get();
        $tags = Auth::user()->tags()->get();
        
        return Inertia::render('Clients/Create', [
            'categories' => $categories,
            'tags' => $tags
        ]);
    }
    
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Vérifier si l'utilisateur peut ajouter plus de clients
        if (!$this->canAddMoreClients($user)) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous avez atteint la limite de clients pour votre plan. Veuillez passer à un plan supérieur.'
                ], 403);
            }
            
            return redirect()->back()->withErrors([
                'limit' => 'Vous avez atteint la limite de clients pour votre plan. Veuillez passer à un plan supérieur.'
            ]);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'birthday' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
            'new_tag' => 'nullable|string|max:50' // Permettre la création d'un nouveau tag
        ]);
        
        $validated['user_id'] = Auth::id();
        
        // Supprimer les tags du tableau validé pour éviter une erreur lors de la création du client
        $tags = $request->input('tags', []);
        if (isset($validated['tags'])) {
            unset($validated['tags']);
        }
        
        // Gérer la création d'un nouveau tag si nécessaire
        if (!empty($validated['new_tag'])) {
            $newTagName = $validated['new_tag'];
            unset($validated['new_tag']);
            
            // Vérifier si le tag existe déjà
            $existingTag = Tag::where('name', $newTagName)
                             ->where('user_id', Auth::id())
                             ->first();
            
            if (!$existingTag) {
                // Créer le nouveau tag
                $newTag = Tag::create([
                    'name' => $newTagName,
                    'user_id' => Auth::id()
                ]);
                
                // Ajouter l'ID du nouveau tag à la liste des tags
                $tags[] = $newTag->id;
            } else {
                // Utiliser le tag existant
                $tags[] = $existingTag->id;
            }
        }
        
        $client = Client::create($validated);
        
        // Attacher les tags sélectionnés
        if (!empty($tags)) {
            $client->tags()->attach($tags);
        }
        
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Client ajouté avec succès.',
                'client' => $client->load(['category', 'tags'])
            ]);
        }
        
        return redirect()->route('clients.index')->with('success', 'Client ajouté avec succès.');
    }
    
    public function edit(Client $client)
    {
        $this->authorize('update', $client);
        
        $client->load('tags');
        
        $categories = Auth::user()->categories()->get();
        $tags = Auth::user()->tags()->get();
        
        return Inertia::render('Clients/Edit', [
            'client' => $client,
            'categories' => $categories,
            'tags' => $tags,
            'selectedTags' => $client->tags->pluck('id')
        ]);
    }
    
    public function update(Request $request, Client $client)
    {
        $this->authorize('update', $client);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'birthday' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
            'new_tag' => 'nullable|string|max:50' // Permettre la création d'un nouveau tag
        ]);
        
        // Supprimer les tags du tableau validé pour la mise à jour
        $tags = $request->input('tags', []);
        if (isset($validated['tags'])) {
            unset($validated['tags']);
        }
        
        // Gérer la création d'un nouveau tag si nécessaire
        if (!empty($validated['new_tag'])) {
            $newTagName = $validated['new_tag'];
            unset($validated['new_tag']);
            
            // Vérifier si le tag existe déjà
            $existingTag = Tag::where('name', $newTagName)
                             ->where('user_id', Auth::id())
                             ->first();
            
            if (!$existingTag) {
                // Créer le nouveau tag
                $newTag = Tag::create([
                    'name' => $newTagName,
                    'user_id' => Auth::id()
                ]);
                
                // Ajouter l'ID du nouveau tag à la liste des tags
                $tags[] = $newTag->id;
            } else {
                // Utiliser le tag existant
                $tags[] = $existingTag->id;
            }
        }
        
        $client->update($validated);
        
        // Synchroniser les tags (supprime les anciens et ajoute les nouveaux)
        $client->tags()->sync($tags);
        
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Client mis à jour avec succès.',
                'client' => $client->load(['category', 'tags'])
            ]);
        }
        
        return redirect()->route('clients.show', $client->id)->with('success', 'Client mis à jour avec succès.');
    }
    
    public function destroy(Client $client)
    {
        $this->authorize('delete', $client);
        
        $client->delete();
        
        return redirect()->route('clients.index')->with('success', 'Client supprimé avec succès.');
    }
    
    /**
     * Afficher les détails d'un client
     *
     * @param  \App\Models\Client  $client
     * @return \Inertia\Response
     */
    public function show(Client $client)
    {
        $this->authorize('view', $client);
        
        // Charger toutes les relations nécessaires
        $client->load([
            'category', 
            'tags', 
            'messages' => function($query) {
                $query->latest('sent_at')->with('campaign');
            },
            'visits' => function($query) {
                $query->latest('visit_date');
            }
        ]);
        
        // Calculer des statistiques pour ce client
        $client->messages_count = $client->messages()->count();
        $client->successful_messages_count = $client->messages()->where('status', 'delivered')->count();
        
        // Obtenir les catégories et tags pour le formulaire d'édition
        $categories = Auth::user()->categories()->get();
        $tags = Auth::user()->tags()->get();
        
        // Calculer si le client est actif (a reçu un message dans les 90 derniers jours)
        $client->is_active = $client->messages()
            ->where('created_at', '>=', now()->subDays(90))
            ->exists();
        
        // Déterminer la dernière date de visite
        $client->last_visit_date = $client->visits->first()?->visit_date;
        
        return Inertia::render('Clients/Show', [
            'client' => $client,
            'categories' => $categories,
            'tags' => $tags,
        ]);
    }
    
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:clients,id'
        ]);
        
        $user = Auth::user();
        
        // Sécurité supplémentaire pour s'assurer que l'utilisateur ne peut supprimer que ses propres clients
        $clients = Client::whereIn('id', $validated['ids'])
                        ->where('user_id', $user->id)
                        ->get();
        
        foreach ($clients as $client) {
            $this->authorize('delete', $client);
            $client->delete();
        }
        
        return response()->json(['success' => true]);
    }
    
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
            
            // Analyser d'abord le fichier pour compter le nombre de clients à importer
            try {
                // Compter le nombre approximatif de lignes dans le fichier
                $fileContent = file_get_contents($request->file('file')->getRealPath());
                $rowCount = substr_count($fileContent, "\n");
                
                // Vérifier si l'importation dépasserait la limite
                if ($currentClientCount + $rowCount > $clientLimit) {
                    return response()->json([
                        'success' => false,
                        'message' => "L'importation dépasserait la limite de clients pour votre plan. Vous pouvez importer au maximum " . 
                                    ($clientLimit - $currentClientCount) . " clients."
                    ], 403);
                }
                
                $mapping = json_decode($request->mapping, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \Exception('Erreur dans le format du mapping JSON: ' . json_last_error_msg());
                }
                
                try {
                    DB::beginTransaction();
                    Excel::import(new ClientsImport($mapping, Auth::id()), $request->file('file'));
                    DB::commit();
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Les clients ont été importés avec succès.'
                    ]);
                } catch (\Exception $e) {
                    DB::rollBack();
                    \Log::error('Erreur lors de l\'importation Excel: ' . $e->getMessage(), [
                        'file' => $e->getFile(),
                        'line' => $e->getLine()
                    ]);
                    
                    throw $e;
                }
            } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
                \Log::error('Erreur de validation Excel: ' . json_encode($e->errors()));
                
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation des données : ' . implode(', ', $e->errors())
                ], 422);
            } catch (\Exception $e) {
                \Log::error('Erreur générale lors de l\'importation: ' . $e->getMessage(), [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'importation: ' . $e->getMessage()
                ], 500);
            }
        } catch (\Exception $e) {
            \Log::error('Erreur d\'importation: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function export(Request $request)
    {
        try {
            $query = Auth::user()->clients()->with(['category', 'tags']);
            
            // Appliquer les mêmes filtres que pour l'index
            if ($request->has('category_id') && $request->category_id) {
                $query->where('category_id', $request->category_id);
            }
            
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }
            
            // Plus de filtres
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
            $fileName = 'clients.' . $format;
            
            return Excel::download(new ClientsExport($clients), $fileName, \Maatwebsite\Excel\Excel::CSV, [
                'Content-Type' => 'text/csv',
            ]);
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'exportation: ' . $e->getMessage()
                ], 500);
            }
            
            return back()->withErrors(['export' => 'Une erreur est survenue lors de l\'exportation: ' . $e->getMessage()]);
        }
    }

    /**
     * Enregistrer une visite pour un client
     */
    public function recordVisit(Request $request, Client $client)
    {
        $this->authorize('view', $client);

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $visit = new Visit([
            'client_id' => $client->id,
            'user_id' => Auth::id(),
            'visit_date' => now(), // Utiliser le bon champ visit_date
            'notes' => $validated['notes'] ?? null,
        ]);

        $visit->save();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Visite enregistrée avec succès',
                'visit' => $visit
            ]);
        }

        return redirect()->back()->with('success', 'Visite enregistrée avec succès');
    }

    /**
     * Envoyer un message direct à un client
     */
    public function sendMessage(Request $request, Client $client)
    {
        $this->authorize('view', $client);

        $validated = $request->validate([
            'content' => 'required|string|max:800', // 5 SMS max (~160 caractères par SMS)
        ]);

        // Créer le message
        $message = new Message([
            'client_id' => $client->id,
            'user_id' => Auth::id(),
            'content' => $validated['content'],
            'status' => 'pending', // Le statut sera mis à jour par le service d'envoi de SMS
            'sent_at' => now(),
        ]);

        $message->save();

        // Ici, vous pourriez appeler votre service d'envoi de SMS réel
        // Pour l'exemple, nous allons simuler un succès d'envoi après un court délai
        try {
            // Simule un appel à un service externe
            // Dans une application réelle, vous appelleriez votre service SMS ici
            $message->status = 'delivered';
            $message->save();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Message envoyé avec succès',
                    'sms' => $message
                ]);
            }

            return redirect()->back()->with('success', 'Message envoyé avec succès');
        } catch (\Exception $e) {
            // En cas d'échec, mettre à jour le statut
            $message->status = 'failed';
            $message->save();

            \Log::error('Erreur lors de l\'envoi du SMS: ' . $e->getMessage(), [
                'client_id' => $client->id,
                'message_id' => $message->id
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de l\'envoi du message'
                ], 500);
            }

            return redirect()->back()->withErrors(['sms' => 'Erreur lors de l\'envoi du message']);
        }
    }

    /**
     * Obtenir l'historique des visites d'un client
     */
    public function getVisitHistory(Client $client)
    {
        $this->authorize('view', $client);

        $visits = $client->visits()
            ->with('user')
            ->orderBy('visit_date', 'desc')
            ->paginate(10);

        return Inertia::render('Clients/VisitHistory', [
            'client' => $client,
            'visits' => $visits
        ]);
    }
}