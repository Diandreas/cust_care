<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Client;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MessageController extends Controller
{
    public function index()
    {
        $messages = Auth::user()->messages()
            ->with('client')
            ->orderBy('created_at', 'desc')
            ->paginate(15);
        
        return Inertia::render('Messages/Index', [
            'messages' => $messages
        ]);
    }
    
    public function create()
    {
        $clients = Auth::user()->clients()->get();
        $templates = Auth::user()->templates()->get();
        
        return Inertia::render('Messages/Create', [
            'clients' => $clients,
            'templates' => $templates
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'content' => 'required|string',
        ]);
        
        Message::create([
            'user_id' => Auth::id(),
            'client_id' => $validated['client_id'],
            'content' => $validated['content'],
            'type' => 'personal',
            'status' => 'sent',
            'sent_at' => now(),
        ]);
        
        return redirect()->route('messages.index')->with('success', 'Message envoyé avec succès.');
    }
} 