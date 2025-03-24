<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Client;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        
        // Statistiques pour le tableau de bord
        $stats = [
            'total_clients' => $user->clients()->count(),
            'total_messages' => $user->messages()->count(),
            'total_campaigns' => $user->campaigns()->count(),
            'recent_messages' => $user->messages()->latest()->take(5)->with('client')->get(),
            'upcoming_campaigns' => $user->campaigns()
                ->where('status', 'scheduled')
                ->where('scheduled_at', '>', now())
                ->orderBy('scheduled_at')
                ->take(3)
                ->get(),
            'subscription' => $user->subscription,
        ];
        
        return Inertia::render('Dashboard', [
            'stats' => $stats
        ]);
    }
} 