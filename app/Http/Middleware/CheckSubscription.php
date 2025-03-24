<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        // Vérifier si l'utilisateur a un abonnement actif
        if (!$user->subscription || $user->subscription->status !== 'active') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Vous devez avoir un abonnement actif pour accéder à cette fonctionnalité.',
                ], 403);
            }
            
            return redirect()->route('subscription.plans')->with('error', 'Vous devez avoir un abonnement actif pour accéder à cette fonctionnalité.');
        }
        
        return $next($request);
    }
}
