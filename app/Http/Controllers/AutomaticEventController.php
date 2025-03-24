<?php

namespace App\Http\Controllers;

use App\Models\AutomaticEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AutomaticEventController extends Controller
{
    public function index()
    {
        $events = Auth::user()->automaticEvents()->get();
        
        return Inertia::render('AutomaticEvents/Index', [
            'events' => $events
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'event_type' => 'required|in:birthday,holiday,custom',
            'message_template' => 'required|string',
            'is_active' => 'boolean',
            'trigger_date' => 'nullable|date|required_if:event_type,holiday,custom'
        ]);
        
        $validated['user_id'] = Auth::id();
        
        AutomaticEvent::create($validated);
        
        return redirect()->back()->with('success', 'Événement automatique créé avec succès.');
    }
    
    public function update(Request $request, AutomaticEvent $event)
    {
        $this->authorize('update', $event);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'event_type' => 'required|in:birthday,holiday,custom',
            'message_template' => 'required|string',
            'is_active' => 'boolean',
            'trigger_date' => 'nullable|date|required_if:event_type,holiday,custom'
        ]);
        
        $event->update($validated);
        
        return redirect()->back()->with('success', 'Événement automatique mis à jour avec succès.');
    }
    
    public function destroy(AutomaticEvent $event)
    {
        $this->authorize('delete', $event);
        
        $event->delete();
        
        return redirect()->back()->with('success', 'Événement automatique supprimé avec succès.');
    }
} 