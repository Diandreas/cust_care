<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasActiveSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        $user = Auth::user();
        $hasActiveSubscription = $user->subscription?->isActive() ?? false;

        if (!$hasActiveSubscription) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous devez avoir un abonnement actif pour accéder à cette fonctionnalité.'
                ], 403);
            }
            
            return redirect()->route('subscription.plans')->withErrors([
                'subscription' => 'Vous devez avoir un abonnement actif pour accéder à cette fonctionnalité.'
            ]);
        }

        return $next($request);
    }
}
