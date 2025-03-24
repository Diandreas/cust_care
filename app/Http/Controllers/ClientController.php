<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Category;
use App\Models\Tag;
use App\Models\Message;
use App\Exports\ClientsExport;
use App\Imports\ClientsImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Auth::user()->clients()
            ->with(['category', 'tags'])
            ->withCount('messages as totalSmsCount')
            ->withMax('messages as lastSmsDate', 'created_at')
            ->withMax('messages as lastContact', 'created_at');
        
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
            $query->whereRaw('MONTH(birthday) = ?', [$request->birthday_month]);
        }
        
        if ($request->has('date_range') && $request->date_range) {
            switch($request->date_range) {
                case 'today':
                    $query->whereDate('created_at', Carbon::today());
                    break;
                case 'this_week':
                    $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                    break;
                case 'this_month':
                    $query->whereMonth('created_at', Carbon::now()->month)
                          ->whereYear('created_at', Carbon::now()->year);
                    break;
                case 'last_30_days':
                    $query->where('created_at', '>=', Carbon::now()->subDays(30));
                    break;
                case 'this_year':
                    $query->whereYear('created_at', Carbon::now()->year);
                    break;
            }
        }
        
        // Tri
        $sortBy = $request->input('sort_by', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        
        $allowedSortFields = [
            'name', 'created_at', 'birthday', 'lastContact', 'totalSmsCount'
        ];
        
        if (in_array($sortBy, $allowedSortFields)) {
            if ($sortBy === 'lastContact') {
                $query->orderBy('lastContact', $sortDirection);
            } elseif ($sortBy === 'totalSmsCount') {
                $query->orderBy('totalSmsCount', $sortDirection);
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
            'newClientsThisMonth' => $user->clients()->whereMonth('created_at', Carbon::now()->month)
                                         ->whereYear('created_at', Carbon::now()->year)
                                         ->count(),
            'activeClientsLast30Days' => $user->clients()
                                             ->whereHas('messages', function($q) {
                                                 $q->where('created_at', '>=', Carbon::now()->subDays(30));
                                             })
                                             ->count(),
            'totalSmsSent' => $user->messages()->count(),
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
        // Logique de récupération de l'abonnement
        // Pour l'exemple, nous utilisons des données simulées
        
        // En pratique, vous récupéreriez ces informations depuis votre
        // base de données ou un service d'abonnement externe
        
        // Simulons différents plans basés sur le nombre de clients
        $clientCount = $user->clients()->count();
        
        if ($clientCount <= 100) {
            return [
                'plan' => 'Pack Starter',
                'clientsLimit' => 100,
                'clientsCount' => $clientCount,
                'smsBalance' => 200 - $user->messages()->whereMonth('created_at', Carbon::now()->month)->count()
            ];
        } else if ($clientCount <= 500) {
            return [
                'plan' => 'Pack Business',
                'clientsLimit' => 500,
                'clientsCount' => $clientCount,
                'smsBalance' => 1000 - $user->messages()->whereMonth('created_at', Carbon::now()->month)->count()
            ];
        } else {
            return [
                'plan' => 'Pack Enterprise',
                'clientsLimit' => 2000,
                'clientsCount' => $clientCount,
                'smsBalance' => 4000 - $user->messages()->whereMonth('created_at', Carbon::now()->month)->count()
            ];
        }
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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'category_id' => 'nullable|exists:categories,id',
            'birthday' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id'
        ]);
        
        $validated['user_id'] = Auth::id();
        
        // Supprimer les tags du tableau validé pour éviter une erreur lors de la création du client
        $tags = $request->input('tags', []);
        if (isset($validated['tags'])) {
            unset($validated['tags']);
        }
        
        $client = Client::create($validated);
        
        // Attacher les tags sélectionnés
        if (!empty($tags)) {
            $client->tags()->attach($tags);
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
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id'
        ]);
        
        // Supprimer les tags du tableau validé pour la mise à jour
        $tags = $request->input('tags', []);
        if (isset($validated['tags'])) {
            unset($validated['tags']);
        }
        
        $client->update($validated);
        
        // Synchroniser les tags (supprime les anciens et ajoute les nouveaux)
        $client->tags()->sync($tags);
        
        return redirect()->route('clients.index')->with('success', 'Client mis à jour avec succès.');
    }
    
    public function destroy(Client $client)
    {
        $this->authorize('delete', $client);
        
        $client->delete();
        
        return redirect()->route('clients.index')->with('success', 'Client supprimé avec succès.');
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
        $request->validate([
            'file' => 'required|file|mimes:csv,txt,xls,xlsx',
            'mapping' => 'required|json'
        ]);
        
        $mapping = json_decode($request->mapping, true);
        
        try {
            Excel::import(new ClientsImport($mapping, Auth::id()), $request->file('file'));
            
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de l\'importation: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function export(Request $request)
    {
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
        
        return Excel::download(new ClientsExport($clients), 'clients.' . $format);
    }
}