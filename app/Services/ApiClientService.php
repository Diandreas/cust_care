<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ApiClientService
{
    protected $failureCount = [];
    protected $lastFailTime = [];
    protected $circuitOpen = [];
    
    // Paramètres de configuration
    protected $maxFailures = 3;
    protected $resetTimeout = 60; // secondes
    
    /**
     * Effectuer un appel API avec gestion de circuit breaker
     * 
     * @param string $service Identifiant du service externe
     * @param string $method Méthode HTTP (get, post, etc.)
     * @param string $endpoint URL de l'endpoint
     * @param array $data Données à envoyer
     * @param array $headers En-têtes HTTP
     * @return mixed Données de réponse JSON
     * @throws CircuitOpenException Si le circuit est ouvert
     * @throws ApiCallException En cas d'erreur d'appel API
     */
    public function call($service, $method, $endpoint, $data = [], $headers = [])
    {
        // 1. Vérifier si le circuit est ouvert
        if ($this->isCircuitOpen($service)) {
            if ($this->canRetry($service)) {
                // On tente une réinitialisation
                $this->resetCircuit($service);
            } else {
                throw new CircuitOpenException("Le service $service est temporairement indisponible");
            }
        }
        
        try {
            // 2. Effectuer l'appel API avec retry configurable
            $response = Http::withHeaders($headers)
                ->timeout(15)
                ->retry(2, 500)
                ->$method($endpoint, $data);
            
            // 3. Si succès, réinitialiser les compteurs
            if ($response->successful()) {
                $this->resetFailures($service);
                return $response->json();
            }
            
            // 4. Gérer l'échec
            $this->recordFailure($service);
            throw new ApiCallException("Erreur API $service: " . $response->status(), $response);
            
        } catch (\Exception $e) {
            // 5. Gérer les exceptions (timeout, etc.)
            $this->recordFailure($service);
            
            if ($e instanceof ApiCallException) {
                throw $e;
            }
            
            throw new ApiCallException("Exception lors de l'appel à $service: " . $e->getMessage(), null, $e);
        }
    }
    
    /**
     * Vérifier si le circuit est ouvert pour un service
     */
    protected function isCircuitOpen($service)
    {
        return Cache::get("circuit_breaker_{$service}_open", false);
    }
    
    /**
     * Vérifier si on peut tenter une réinitialisation du circuit
     */
    protected function canRetry($service)
    {
        $lastFailTime = Cache::get("circuit_breaker_{$service}_last_fail", 0);
        return (time() - $lastFailTime) > $this->resetTimeout;
    }
    
    /**
     * Réinitialiser le circuit
     */
    protected function resetCircuit($service)
    {
        Log::info("Tentative de réinitialisation du circuit pour $service");
        Cache::put("circuit_breaker_{$service}_open", false, 3600);
        Cache::put("circuit_breaker_{$service}_failures", 0, 3600);
    }
    
    /**
     * Enregistrer un échec pour un service
     */
    protected function recordFailure($service)
    {
        $failures = Cache::get("circuit_breaker_{$service}_failures", 0) + 1;
        Cache::put("circuit_breaker_{$service}_failures", $failures, 3600);
        Cache::put("circuit_breaker_{$service}_last_fail", time(), 3600);
        
        Log::warning("Échec d'appel API pour $service (tentative $failures/$this->maxFailures)");
        
        // Ouvrir le circuit si le nombre maximum d'échecs est atteint
        if ($failures >= $this->maxFailures) {
            Log::error("Circuit ouvert pour $service après $failures échecs");
            Cache::put("circuit_breaker_{$service}_open", true, 3600);
        }
    }
    
    /**
     * Réinitialiser les compteurs d'échecs
     */
    protected function resetFailures($service)
    {
        Cache::put("circuit_breaker_{$service}_failures", 0, 3600);
    }
}

class CircuitOpenException extends \Exception
{
}

class ApiCallException extends \Exception
{
    protected $response;
    
    public function __construct($message, $response = null, \Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
        $this->response = $response;
    }
    
    public function getResponse()
    {
        return $this->response;
    }
} 