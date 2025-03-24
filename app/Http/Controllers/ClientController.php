<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Auth::user()->clients()->with('category');
        
        // Filtrer par catégorie si fournie
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }
        
        // Recherche si fournie
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        $clients = $query->orderBy('name')->paginate(10);
        $categories = Auth::user()->categories()->get();
        
        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id'])
        ]);
    }
    
    public function create()
    {
        $categories = Auth::user()->categories()->get();
        
        return Inertia::render('Clients/Create', [
            'categories' => $categories
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
            'notes' => 'nullable|string'
        ]);
        
        $validated['user_id'] = Auth::id();
        
        Client::create($validated);
        
        return redirect()->route('clients.index')->with('success', 'Client ajouté avec succès.');
    }
    
    public function edit(Client $client)
    {
        $this->authorize('update', $client);
        
        $categories = Auth::user()->categories()->get();
        
        return Inertia::render('Clients/Edit', [
            'client' => $client,
            'categories' => $categories
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
            'notes' => 'nullable|string'
        ]);
        
        $client->update($validated);
        
        return redirect()->route('clients.index')->with('success', 'Client mis à jour avec succès.');
    }
    
    public function destroy(Client $client)
    {
        $this->authorize('delete', $client);
        
        $client->delete();
        
        return redirect()->route('clients.index')->with('success', 'Client supprimé avec succès.');
    }
} 