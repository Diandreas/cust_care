<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TemplateController extends Controller
{
    public function index()
    {
        $templates = Auth::user()->templates()->get();
        
        return Inertia::render('Templates/Index', [
            'templates' => $templates
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'is_global' => 'boolean'
        ]);
        
        $validated['user_id'] = Auth::id();
        
        Template::create($validated);
        
        return redirect()->back()->with('success', 'Modèle créé avec succès.');
    }
    
    public function update(Request $request, Template $template)
    {
        $this->authorize('update', $template);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'required|string',
            'is_global' => 'boolean'
        ]);
        
        $template->update($validated);
        
        return redirect()->back()->with('success', 'Modèle mis à jour avec succès.');
    }
    
    public function destroy(Template $template)
    {
        $this->authorize('delete', $template);
        
        $template->delete();
        
        return redirect()->back()->with('success', 'Modèle supprimé avec succès.');
    }
} 