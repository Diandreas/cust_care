<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Auth::user()->categories()->withCount('clients')->get();
        
        return Inertia::render('Categories/Index', [
            'categories' => $categories
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);
        
        $validated['user_id'] = Auth::id();
        
        Category::create($validated);
        
        return redirect()->back()->with('success', 'Catégorie créée avec succès.');
    }
    
    public function update(Request $request, Category $category)
    {
        $this->authorize('update', $category);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string'
        ]);
        
        $category->update($validated);
        
        return redirect()->back()->with('success', 'Catégorie mise à jour avec succès.');
    }
    
    public function destroy(Category $category)
    {
        $this->authorize('delete', $category);
        
        $category->delete();
        
        return redirect()->back()->with('success', 'Catégorie supprimée avec succès.');
    }
} 