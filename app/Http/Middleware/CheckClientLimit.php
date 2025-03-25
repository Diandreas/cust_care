<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

class CheckClientLimit
{
    /**
     * Liste des routes qui peuvent créer ou importer des clients
     */
    protected $clientCreationRoutes = [
        'clients.store',
        'clients.import'
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Ne vérifier que pour les routes qui créent des clients
        if (!in_array(Route::currentRouteName(), $this->clientCreationRoutes)) {
            return $next($request);
        }

        // Vérifier si l'utilisateur est connecté
        if (!Auth::check()) {
            return $next($request);
        }

        $user = Auth::user();
        
        // Vérifier si l'utilisateur a un abonnement actif
        $hasActiveSubscription = $user->subscription?->isActive() ?? false;
        
        // Si l'utilisateur n'a pas d'abonnement, vérifier la limite de clients
        if (!$hasActiveSubscription) {
            $clientCount = $user->clients()->count();
            
            // Limite du plan gratuit : 50 clients
            if ($clientCount >= 50) {
                if ($request->wantsJson() || $request->ajax()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Vous avez atteint la limite de 50 clients du plan gratuit. Veuillez souscrire à un abonnement pour ajouter plus de clients.'
                    ], 403);
                }
                
                return redirect()->route('subscription.plans')->withErrors([
                    'limit' => 'Vous avez atteint la limite de 50 clients du plan gratuit. Veuillez souscrire à un abonnement pour ajouter plus de clients.'
                ]);
            }
        }

        return $next($request);
    }
}
