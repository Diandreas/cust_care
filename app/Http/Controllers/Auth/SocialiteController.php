<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Exception;

class SocialiteController extends Controller
{
    /**
     * Redirige l'utilisateur vers le fournisseur d'authentification externe.
     *
     * @param  string  $provider
     * @return \Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function redirect($provider)
    {
        try {
            if ($provider !== 'google') {
                return redirect()->route('login')
                    ->with('error', "Le fournisseur {$provider} n'est pas pris en charge.");
            }
            
            return Socialite::driver($provider)->redirect();
        } catch (Exception $e) {
            Log::error("Erreur lors de la redirection vers {$provider}: " . $e->getMessage());
            return redirect()->route('login')
                ->with('error', "Impossible de se connecter via {$provider}. Veuillez réessayer ultérieurement.");
        }
    }

    /**
     * Gère la redirection après l'authentification via le fournisseur externe.
     *
     * @param  Request  $request
     * @param  string  $provider
     * @return \Illuminate\Http\RedirectResponse
     */
    public function callback(Request $request, $provider)
    {
        try {
            // Vérifier si une erreur a été renvoyée par le fournisseur
            if ($request->has('error') || $request->has('error_code')) {
                Log::error("Erreur retournée par {$provider}: " . $request->get('error', 'Unknown error'));
                return redirect()->route('login')
                    ->with('error', 'Authentification annulée ou refusée. Veuillez réessayer.');
            }
            
            Log::info("Début du callback pour {$provider}");
            
            $socialUser = Socialite::driver($provider)->user();
            Log::info("Utilisateur {$provider} récupéré avec succès", [
                'id' => $socialUser->getId(),
                'email' => $socialUser->getEmail(),
                'name' => $socialUser->getName()
            ]);
            
            // Recherche de l'utilisateur par son ID de fournisseur
            $user = User::where([
                "{$provider}_id" => $socialUser->getId(),
            ])->first();
            
            // Si l'utilisateur n'existe pas, recherche par email
            if (!$user) {
                Log::info("Aucun utilisateur trouvé avec l'ID {$provider}. Recherche par email.");
                $user = User::where('email', $socialUser->getEmail())->first();
                
                // Si l'utilisateur existe déjà avec cet email, mettre à jour son ID de fournisseur
                if ($user) {
                    Log::info("Utilisateur trouvé par email. Mise à jour de l'ID {$provider}.");
                    $user->update([
                        "{$provider}_id" => $socialUser->getId(),
                    ]);
                } else {
                    Log::info("Création d'un nouvel utilisateur.");
                    // Créer un nouvel utilisateur
                    $user = User::create([
                        'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'Utilisateur',
                        'email' => $socialUser->getEmail(),
                        'password' => Hash::make(Str::random(24)),
                        'email_verified_at' => now(),
                        "{$provider}_id" => $socialUser->getId(),
                    ]);
                    
                    event(new Registered($user));
                }
            } else {
                Log::info("Utilisateur trouvé avec l'ID {$provider}.");
            }
            
            Auth::login($user);
            Log::info("Utilisateur connecté avec succès. Redirection vers le tableau de bord.");
            
            return redirect()->intended(route('dashboard'));
            
        } catch (Exception $e) {
            // Log l'erreur pour faciliter le débogage
            Log::error("Erreur OAuth complète: " . $e->getMessage());
            Log::error("Trace: " . $e->getTraceAsString());
            
            // Si erreur liée à un jeton invalide ou expiré
            if (strpos($e->getMessage(), 'token') !== false) {
                return redirect()->route('login')
                    ->with('error', 'Session d\'authentification expirée. Veuillez réessayer.');
            }
            
            return redirect()->route('login')
                ->with('error', 'Échec de la connexion via ' . ucfirst($provider) . '. ' . $e->getMessage());
        }
    }
} 