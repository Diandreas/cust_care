<?php

namespace App\Services;

use App\Models\Client;
use App\Models\User;
use App\Models\WhatsAppAuthSession;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;

class WhatsAppService
{
    protected $client;

    public function __construct()
    {
        if (config('services.twilio.sid') && config('services.twilio.token')) {
            $this->client = new \Twilio\Rest\Client(
                config('services.twilio.sid'),
                config('services.twilio.token')
            );
        }
    }

    /**
     * Envoyer un message WhatsApp
     */
    public function sendMessage(string $to, string $message, ?array $media = null): array
    {
        try {
            if (!$this->client) {
                throw new \Exception('Twilio client not configured');
            }

            $params = [
                'from' => 'whatsapp:' . config('services.twilio.whatsapp_number'),
                'body' => $message
            ];

            if ($media) {
                $params['mediaUrl'] = $media;
            }

            $result = $this->client->messages->create(
                'whatsapp:' . $to,
                $params
            );

            Log::info('WhatsApp message sent', [
                'to' => $to,
                'message_sid' => $result->sid,
                'status' => $result->status
            ]);

            return [
                'success' => true,
                'message_sid' => $result->sid,
                'status' => $result->status
            ];

        } catch (\Exception $e) {
            Log::error('WhatsApp message failed', [
                'to' => $to,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Générer et envoyer un code PIN d'authentification
     */
    public function sendAuthPin(string $phoneNumber): array
    {
        try {
            // Nettoyage du numéro de téléphone
            $cleanPhone = $this->cleanPhoneNumber($phoneNumber);

            // Vérifier si pas trop de tentatives récentes
            $recentAttempts = WhatsAppAuthSession::where('phone_number', $cleanPhone)
                ->where('created_at', '>=', now()->subMinutes(5))
                ->count();

            if ($recentAttempts >= 3) {
                return [
                    'success' => false,
                    'error' => 'Trop de tentatives récentes. Veuillez attendre 5 minutes.'
                ];
            }

            // Générer un code PIN à 6 chiffres
            $pinCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

            // Créer la session d'authentification
            $authSession = WhatsAppAuthSession::create([
                'phone_number' => $cleanPhone,
                'pin_code' => $pinCode,
                'expires_at' => now()->addMinutes(10), // Code valide 10 minutes
                'attempts' => 0
            ]);

            // Envoyer le code via WhatsApp
            $message = "🔐 **HelloBoost Customer Care**\n\n";
            $message .= "Votre code d'authentification : **{$pinCode}**\n\n";
            $message .= "Ce code expire dans 10 minutes.\n";
            $message .= "Si vous n'avez pas demandé ce code, ignorez ce message.";

            $result = $this->sendMessage($cleanPhone, $message);

            if (!$result['success']) {
                $authSession->delete();
                return $result;
            }

            return [
                'success' => true,
                'message' => 'Code PIN envoyé avec succès',
                'session_id' => $authSession->id
            ];

        } catch (\Exception $e) {
            Log::error('Erreur envoi code PIN WhatsApp', [
                'phone' => $phoneNumber,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de l\'envoi du code PIN'
            ];
        }
    }

    /**
     * Vérifier un code PIN et authentifier l'utilisateur
     */
    public function verifyPin(string $phoneNumber, string $pinCode, int $userId = null): array
    {
        try {
            $cleanPhone = $this->cleanPhoneNumber($phoneNumber);

            // Trouver la session d'authentification
            $authSession = WhatsAppAuthSession::where('phone_number', $cleanPhone)
                ->where('pin_code', $pinCode)
                ->where('expires_at', '>', now())
                ->where('is_verified', false)
                ->first();

            if (!$authSession) {
                return [
                    'success' => false,
                    'error' => 'Code PIN invalide ou expiré'
                ];
            }

            // Vérifier les tentatives
            $authSession->increment('attempts');

            if ($authSession->attempts > 3) {
                $authSession->update([
                    'is_blocked' => true,
                    'blocked_until' => now()->addMinutes(30)
                ]);

                return [
                    'success' => false,
                    'error' => 'Trop de tentatives incorrectes. Compte bloqué 30 minutes.'
                ];
            }

            // Générer un token de session
            $sessionToken = Str::random(64);

            $authSession->update([
                'user_id' => $userId,
                'is_verified' => true,
                'verified_at' => now(),
                'session_token' => $sessionToken,
                'expires_at' => now()->addHours(24), // Session valide 24h
                'session_data' => [
                    'authenticated_at' => now()->toISOString(),
                    'user_agent' => request()->header('User-Agent'),
                    'ip_address' => request()->ip()
                ]
            ]);

            // Message de confirmation
            $confirmMessage = "✅ **Authentification réussie !**\n\n";
            $confirmMessage .= "Vous pouvez maintenant utiliser l'assistant marketing via WhatsApp.\n\n";
            $confirmMessage .= "Tapez **HELP** pour voir les commandes disponibles.";

            $this->sendMessage($cleanPhone, $confirmMessage);

            Log::info('Authentification WhatsApp réussie', [
                'phone' => $cleanPhone,
                'user_id' => $userId
            ]);

            return [
                'success' => true,
                'session_token' => $sessionToken,
                'expires_at' => $authSession->expires_at
            ];

        } catch (\Exception $e) {
            Log::error('Erreur vérification code PIN', [
                'phone' => $phoneNumber,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de la vérification du code PIN'
            ];
        }
    }

    /**
     * Gérer les messages entrants WhatsApp (Webhook)
     */
    public function handleIncomingMessage(array $request): array
    {
        try {
            $from = str_replace('whatsapp:', '', $request['From'] ?? '');
            $body = trim($request['Body'] ?? '');
            $messageId = $request['MessageSid'] ?? '';

            // Vérifier l'authentification
            $authSession = $this->getActiveSession($from);

            if (!$authSession && !$this->isAuthCommand($body)) {
                return $this->sendAuthPrompt($from);
            }

            // Traiter les commandes
            if ($this->isAuthCommand($body)) {
                return $this->handleAuthCommand($from, $body);
            }

            if (!$authSession) {
                return $this->sendAuthPrompt($from);
            }

            // Traiter les commandes authentifiées
            return $this->handleAuthenticatedCommand($from, $body, $authSession);

        } catch (\Exception $e) {
            Log::error('Erreur traitement message WhatsApp', [
                'error' => $e->getMessage(),
                'request' => $request
            ]);

            return ['success' => false];
        }
    }

    /**
     * Nettoyer le numéro de téléphone
     */
    protected function cleanPhoneNumber(string $phone): string
    {
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        
        if (strpos($phone, '+') !== 0) {
            // Ajouter le préfixe international si manquant
            $phone = '+' . ltrim($phone, '0');
        }

        return $phone;
    }

    /**
     * Obtenir la session active pour un numéro
     */
    protected function getActiveSession(string $phoneNumber): ?WhatsAppAuthSession
    {
        $cleanPhone = $this->cleanPhoneNumber($phoneNumber);

        return WhatsAppAuthSession::where('phone_number', $cleanPhone)
            ->where('is_verified', true)
            ->where('expires_at', '>', now())
            ->where('is_blocked', false)
            ->first();
    }

    /**
     * Vérifier si c'est une commande d'authentification
     */
    protected function isAuthCommand(string $message): bool
    {
        $authCommands = ['CONNECT', 'AUTH', 'LOGIN', 'START'];
        $upperMessage = strtoupper(trim($message));

        return in_array($upperMessage, $authCommands);
    }

    /**
     * Envoyer un prompt d'authentification
     */
    protected function sendAuthPrompt(string $phoneNumber): array
    {
        $message = "🔒 **Authentification requise**\n\n";
        $message .= "Pour utiliser l'assistant marketing, tapez :\n";
        $message .= "**CONNECT**\n\n";
        $message .= "Un code PIN vous sera envoyé pour confirmer votre identité.";

        return $this->sendMessage($phoneNumber, $message);
    }

    /**
     * Gérer les commandes d'authentification
     */
    protected function handleAuthCommand(string $phoneNumber, string $command): array
    {
        if (strtoupper($command) === 'CONNECT') {
            return $this->sendAuthPin($phoneNumber);
        }

        return $this->sendAuthPrompt($phoneNumber);
    }

    /**
     * Gérer les commandes authentifiées
     */
    protected function handleAuthenticatedCommand(string $phoneNumber, string $message, WhatsAppAuthSession $session): array
    {
        $upperMessage = strtoupper(trim($message));

        switch ($upperMessage) {
            case 'HELP':
                return $this->sendHelpMessage($phoneNumber);

            case 'STATS':
                return $this->sendStatsMessage($phoneNumber, $session);

            case 'CLIENTS':
                return $this->sendClientsMessage($phoneNumber, $session);

            case 'LOGOUT':
                return $this->handleLogout($phoneNumber, $session);

            default:
                // Traiter comme une requête à l'IA
                return $this->handleAIRequest($phoneNumber, $message, $session);
        }
    }

    /**
     * Envoyer le message d'aide
     */
    protected function sendHelpMessage(string $phoneNumber): array
    {
        $message = "🤖 **Assistant Marketing - Commandes**\n\n";
        $message .= "**HELP** - Afficher cette aide\n";
        $message .= "**STATS** - Statistiques rapides\n";
        $message .= "**CLIENTS** - Liste des clients récents\n";
        $message .= "**GENERATE** post facebook \"sujet\" - Générer contenu\n";
        $message .= "**CAMPAIGN** \"nom\" - Créer campagne\n";
        $message .= "**LOGOUT** - Se déconnecter\n\n";
        $message .= "Vous pouvez aussi simplement poser des questions à l'assistant !";

        return $this->sendMessage($phoneNumber, $message);
    }

    /**
     * Envoyer les statistiques
     */
    protected function sendStatsMessage(string $phoneNumber, WhatsAppAuthSession $session): array
    {
        if (!$session->user) {
            return $this->sendMessage($phoneNumber, "❌ Utilisateur non trouvé.");
        }

        $user = $session->user;
        $clientsCount = $user->clients()->count();
        $messagesCount = $user->messages()->whereDate('created_at', today())->count();
        $campaignsCount = $user->campaigns()->where('status', 'active')->count();

        $message = "📊 **Statistiques Rapides**\n\n";
        $message .= "👥 Clients : {$clientsCount}\n";
        $message .= "💬 Messages aujourd'hui : {$messagesCount}\n";
        $message .= "📢 Campagnes actives : {$campaignsCount}\n";
        $message .= "📅 " . now()->format('d/m/Y H:i');

        return $this->sendMessage($phoneNumber, $message);
    }

    /**
     * Envoyer la liste des clients récents
     */
    protected function sendClientsMessage(string $phoneNumber, WhatsAppAuthSession $session): array
    {
        if (!$session->user) {
            return $this->sendMessage($phoneNumber, "❌ Utilisateur non trouvé.");
        }

        $recentClients = $session->user->clients()
            ->latest('updated_at')
            ->limit(5)
            ->get();

        if ($recentClients->isEmpty()) {
            return $this->sendMessage($phoneNumber, "📋 Aucun client trouvé.");
        }

        $message = "👥 **Clients Récents**\n\n";
        foreach ($recentClients as $client) {
            $message .= "• {$client->name}\n";
            $message .= "  📞 {$client->phone}\n";
            if ($client->last_visit) {
                $message .= "  🗓️ " . $client->last_visit->format('d/m/Y') . "\n";
            }
            $message .= "\n";
        }

        return $this->sendMessage($phoneNumber, $message);
    }

    /**
     * Gérer la déconnexion
     */
    protected function handleLogout(string $phoneNumber, WhatsAppAuthSession $session): array
    {
        $session->update([
            'is_verified' => false,
            'session_token' => null,
            'expires_at' => now()
        ]);

        $message = "👋 **Déconnexion réussie**\n\n";
        $message .= "Merci d'avoir utilisé l'assistant marketing.\n";
        $message .= "Tapez **CONNECT** pour vous reconnecter.";

        return $this->sendMessage($phoneNumber, $message);
    }

    /**
     * Traiter une requête IA
     */
    protected function handleAIRequest(string $phoneNumber, string $message, WhatsAppAuthSession $session): array
    {
        try {
            // Obtenir le service IA
            $aiService = app(AIContentService::class);

            // Préparer le contexte WhatsApp
            $context = [
                'platform' => 'whatsapp',
                'session_id' => $session->session_token,
                'client_id' => null,
                'phone_number' => $phoneNumber
            ];

            // Analyser le message pour détecter des commandes spéciales
            $commandResult = $this->parseSpecialCommands($message, $session);
            if ($commandResult) {
                return $commandResult;
            }

            // Générer la réponse IA
            $aiResponse = $aiService->generateChatResponse($message, $context, $session->user);

            if (!$aiResponse['success']) {
                return $this->sendMessage($phoneNumber, "❌ Désolé, je n'ai pas pu traiter votre demande. Essayez à nouveau.");
            }

            // Formater la réponse pour WhatsApp (limitation de caractères)
            $formattedResponse = $this->formatForWhatsApp($aiResponse['content']);

            // Envoyer la réponse
            $result = $this->sendMessage($phoneNumber, $formattedResponse);

            // Sauvegarder l'interaction
            $this->logWhatsAppInteraction($session, $message, $formattedResponse);

            return $result;

        } catch (\Exception $e) {
            Log::error('Erreur traitement requête IA WhatsApp', [
                'phone' => $phoneNumber,
                'message' => $message,
                'error' => $e->getMessage()
            ]);

            return $this->sendMessage($phoneNumber, "❌ Erreur lors du traitement de votre demande.");
        }
    }

    /**
     * Parser les commandes spéciales dans le message
     */
    protected function parseSpecialCommands(string $message, WhatsAppAuthSession $session): ?array
    {
        $upperMessage = strtoupper(trim($message));

        // Commande: GENERATE POST [plateforme] [sujet]
        if (preg_match('/^GENERATE\s+POST\s+(\w+)\s+(.+)$/i', $message, $matches)) {
            $platform = strtolower($matches[1]);
            $topic = trim($matches[2], '"\'');
            return $this->handleGeneratePostCommand($session->phone_number, $platform, $topic, $session);
        }

        // Commande: ANALYZE [type]
        if (preg_match('/^ANALYZE\s+(.+)$/i', $message, $matches)) {
            $analysisType = trim($matches[1]);
            return $this->handleAnalyzeCommand($session->phone_number, $analysisType, $session);
        }

        // Commande: CREATE CAMPAIGN [nom]
        if (preg_match('/^CREATE\s+CAMPAIGN\s+(.+)$/i', $message, $matches)) {
            $campaignName = trim($matches[1], '"\'');
            return $this->handleCreateCampaignCommand($session->phone_number, $campaignName, $session);
        }

        return null;
    }

    /**
     * Gérer la commande de génération de post
     */
    protected function handleGeneratePostCommand(string $phoneNumber, string $platform, string $topic, WhatsAppAuthSession $session): array
    {
        try {
            $aiService = app(AIContentService::class);
            
            $validPlatforms = ['facebook', 'instagram', 'linkedin', 'twitter'];
            if (!in_array($platform, $validPlatforms)) {
                $platform = 'facebook'; // Défaut
            }

            $result = $aiService->generateSocialPost($topic, $platform, 'engaging', [], $session->user);

            if (!$result['success']) {
                return $this->sendMessage($phoneNumber, "❌ Impossible de générer le post pour le moment.");
            }

            $response = "📝 **Post généré pour {$platform}**\n\n";
            $response .= $result['content'] . "\n\n";
            $response .= "📊 Statistiques:\n";
            $response .= "• Caractères: {$result['character_count']}\n";
            $response .= "• Mots: {$result['word_count']}\n";
            
            if (!empty($result['hashtags'])) {
                $response .= "• Hashtags: " . implode(' ', $result['hashtags']);
            }

            return $this->sendMessage($phoneNumber, $response);

        } catch (\Exception $e) {
            Log::error('Erreur commande generate post WhatsApp', [
                'phone' => $phoneNumber,
                'platform' => $platform,
                'topic' => $topic,
                'error' => $e->getMessage()
            ]);

            return $this->sendMessage($phoneNumber, "❌ Erreur lors de la génération du post.");
        }
    }

    /**
     * Gérer la commande d'analyse
     */
    protected function handleAnalyzeCommand(string $phoneNumber, string $analysisType, WhatsAppAuthSession $session): array
    {
        try {
            if (!$session->user) {
                return $this->sendMessage($phoneNumber, "❌ Utilisateur non trouvé pour l'analyse.");
            }

            $user = $session->user;
            
            switch (strtolower($analysisType)) {
                case 'performance':
                case 'performances':
                    // Données fictives pour la démo
                    $performanceData = [
                        'messages_sent' => $user->messages()->count(),
                        'campaigns_active' => $user->campaigns()->where('status', 'active')->count(),
                        'clients_count' => $user->clients()->count(),
                        'period' => 'last_30_days'
                    ];

                    $aiService = app(AIContentService::class);
                    $analysis = $aiService->analyzePerformance($performanceData, $user);

                    if (!$analysis['success']) {
                        return $this->sendMessage($phoneNumber, "❌ Impossible d'analyser les performances.");
                    }

                    $response = "📊 **Analyse des Performances**\n\n";
                    $response .= "Données analysées: {$analysis['data_points']} points\n\n";
                    
                    // Simplifier l'analyse pour WhatsApp
                    if (isset($analysis['analysis']['tendances'])) {
                        $response .= "🔍 **Tendances principales:**\n";
                        $response .= substr($analysis['analysis']['tendances'], 0, 200) . "...\n\n";
                    }
                    
                    $response .= "📈 Consultez votre dashboard pour l'analyse complète.";
                    
                    return $this->sendMessage($phoneNumber, $response);

                default:
                    return $this->sendMessage($phoneNumber, "❌ Type d'analyse non reconnu. Utilisez: ANALYZE PERFORMANCE");
            }

        } catch (\Exception $e) {
            Log::error('Erreur commande analyze WhatsApp', [
                'phone' => $phoneNumber,
                'analysis_type' => $analysisType,
                'error' => $e->getMessage()
            ]);

            return $this->sendMessage($phoneNumber, "❌ Erreur lors de l'analyse.");
        }
    }

    /**
     * Gérer la commande de création de campagne
     */
    protected function handleCreateCampaignCommand(string $phoneNumber, string $campaignName, WhatsAppAuthSession $session): array
    {
        try {
            if (!$session->user) {
                return $this->sendMessage($phoneNumber, "❌ Utilisateur non trouvé.");
            }

            // Pour l'instant, on retourne juste une confirmation
            // Dans une prochaine version, on créera vraiment la campagne
            $response = "🚀 **Campagne en préparation**\n\n";
            $response .= "Nom: \"{$campaignName}\"\n";
            $response .= "Statut: Brouillon créé\n\n";
            $response .= "📱 Connectez-vous à votre dashboard pour configurer:\n";
            $response .= "• Audience cible\n";
            $response .= "• Messages et contenu\n";
            $response .= "• Planning d'envoi\n\n";
            $response .= "✨ L'IA peut vous aider à optimiser le contenu !";

            return $this->sendMessage($phoneNumber, $response);

        } catch (\Exception $e) {
            Log::error('Erreur commande create campaign WhatsApp', [
                'phone' => $phoneNumber,
                'campaign_name' => $campaignName,
                'error' => $e->getMessage()
            ]);

            return $this->sendMessage($phoneNumber, "❌ Erreur lors de la création de campagne.");
        }
    }

    /**
     * Formater la réponse pour WhatsApp (limite de caractères)
     */
    protected function formatForWhatsApp(string $content): string
    {
        // WhatsApp limite à ~4096 caractères
        if (strlen($content) > 3800) {
            $content = substr($content, 0, 3800) . "\n\n... (message tronqué)\n📱 Consultez votre dashboard pour la suite.";
        }

        // Améliorer le formatage pour mobile
        $content = str_replace(['**', '*'], ['*', '_'], $content);
        
        return $content;
    }

    /**
     * Enregistrer l'interaction WhatsApp pour les statistiques
     */
    protected function logWhatsAppInteraction(WhatsAppAuthSession $session, string $userMessage, string $botResponse): void
    {
        try {
            // Mettre à jour les statistiques de session
            $session->increment('total_messages');
            $session->update(['last_activity_at' => now()]);

            // Log pour analytics
            Log::info('WhatsApp IA interaction', [
                'user_id' => $session->user_id,
                'phone' => $session->phone_number,
                'message_length' => strlen($userMessage),
                'response_length' => strlen($botResponse),
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur log interaction WhatsApp', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Envoyer des messages en masse avec personnalisation IA
     */
    public function sendBulkPersonalizedMessages(array $clientIds, string $template, int $userId, array $options = []): array
    {
        try {
            if (!$this->client) {
                throw new \Exception('Twilio client not configured');
            }

            $results = [];
            $aiService = app(AIContentService::class);
            $user = \App\Models\User::find($userId);

            foreach ($clientIds as $clientId) {
                try {
                    $client = \App\Models\Client::find($clientId);
                    if (!$client || !$client->phone) {
                        $results[] = [
                            'client_id' => $clientId,
                            'success' => false,
                            'error' => 'Client ou téléphone manquant'
                        ];
                        continue;
                    }

                    // Personnaliser le message avec l'IA
                    $personalizationResult = $aiService->personalizeMessage($client, $template, $options);
                    
                    if (!$personalizationResult['success']) {
                        $results[] = [
                            'client_id' => $clientId,
                            'success' => false,
                            'error' => 'Erreur personnalisation IA'
                        ];
                        continue;
                    }

                    // Envoyer le message personnalisé
                    $sendResult = $this->sendMessage(
                        $client->phone, 
                        $personalizationResult['personalized_message']
                    );

                    $results[] = array_merge($sendResult, [
                        'client_id' => $clientId,
                        'client_name' => $client->name,
                        'personalized' => true
                    ]);

                    // Éviter de surcharger l'API
                    sleep(1);

                } catch (\Exception $e) {
                    $results[] = [
                        'client_id' => $clientId,
                        'success' => false,
                        'error' => $e->getMessage()
                    ];
                }
            }

            $successCount = count(array_filter($results, fn($r) => $r['success'] === true));

            Log::info('Envoi en masse WhatsApp avec IA', [
                'user_id' => $userId,
                'total_clients' => count($clientIds),
                'successful' => $successCount,
                'failed' => count($results) - $successCount
            ]);

            return [
                'success' => true,
                'results' => $results,
                'total' => count($results),
                'successful' => $successCount,
                'failed' => count($results) - $successCount
            ];

        } catch (\Exception $e) {
            Log::error('Erreur envoi en masse WhatsApp', [
                'user_id' => $userId,
                'client_count' => count($clientIds),
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de l\'envoi en masse'
            ];
        }
    }

    /**
     * Envoyer un code PIN d'authentification WhatsApp
     */
    public function sendAuthPin(string $phoneNumber): array
    {
        try {
            if (!$this->client) {
                throw new \Exception('Twilio client not configured');
            }

            // Normaliser le numéro de téléphone
            $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);
            
            // Générer un code PIN à 6 chiffres
            $pin = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            
            // Message d'authentification
            $message = "🔐 Code d'authentification HelloBoost: {$pin}\n\n";
            $message .= "Ce code est valable 10 minutes. Ne le partagez avec personne.\n";
            $message .= "Si vous n'avez pas demandé ce code, ignorez ce message.";

            // Envoyer le SMS
            $result = $this->sendMessage($normalizedPhone, $message);
            
            if (!$result['success']) {
                return [
                    'success' => false,
                    'error' => 'Impossible d\'envoyer le code PIN'
                ];
            }

            // Stocker le PIN dans la session avec expiration
            $expiresAt = now()->addMinutes(10);
            
            // Créer ou mettre à jour la session d'authentification
            $authSession = \App\Models\WhatsAppAuthSession::updateOrCreate([
                'phone_number' => $normalizedPhone
            ], [
                'verification_code' => $pin,
                'expires_at' => $expiresAt,
                'is_verified' => false,
                'attempts' => 0,
                'last_attempt_at' => null
            ]);

            Log::info('PIN WhatsApp envoyé', [
                'phone' => $normalizedPhone,
                'session_id' => $authSession->id
            ]);

            return [
                'success' => true,
                'message' => 'Code PIN envoyé avec succès',
                'expires_at' => $expiresAt->toISOString(),
                'session_token' => $authSession->session_token
            ];

        } catch (\Exception $e) {
            Log::error('Erreur envoi PIN WhatsApp', [
                'phone' => $phoneNumber,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de l\'envoi du code PIN'
            ];
        }
    }

    /**
     * Vérifier le code PIN d'authentification
     */
    public function verifyPin(string $phoneNumber, string $pin, ?int $userId = null): array
    {
        try {
            $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);
            
            // Trouver la session d'authentification
            $authSession = \App\Models\WhatsAppAuthSession::where('phone_number', $normalizedPhone)
                ->where('is_verified', false)
                ->where('expires_at', '>', now())
                ->first();

            if (!$authSession) {
                return [
                    'success' => false,
                    'error' => 'Code PIN expiré ou introuvable'
                ];
            }

            // Vérifier le nombre de tentatives (max 3)
            if ($authSession->attempts >= 3) {
                $authSession->delete();
                return [
                    'success' => false,
                    'error' => 'Trop de tentatives. Demandez un nouveau code.'
                ];
            }

            // Incrémenter les tentatives
            $authSession->increment('attempts');
            $authSession->update(['last_attempt_at' => now()]);

            // Vérifier le code PIN
            if ($authSession->verification_code !== $pin) {
                return [
                    'success' => false,
                    'error' => 'Code PIN incorrect',
                    'attempts_remaining' => 3 - $authSession->attempts
                ];
            }

            // Code correct - activer la session
            $sessionToken = \Illuminate\Support\Str::random(64);
            $sessionExpiry = now()->addHours(24); // Session valable 24h

            $authSession->update([
                'is_verified' => true,
                'session_token' => $sessionToken,
                'expires_at' => $sessionExpiry,
                'user_id' => $userId,
                'verified_at' => now()
            ]);

            Log::info('Authentification WhatsApp réussie', [
                'phone' => $normalizedPhone,
                'user_id' => $userId,
                'session_id' => $authSession->id
            ]);

            return [
                'success' => true,
                'message' => 'Authentification réussie',
                'session_token' => $sessionToken,
                'expires_at' => $sessionExpiry->toISOString(),
                'welcome_message' => $this->generateWelcomeMessage($userId)
            ];

        } catch (\Exception $e) {
            Log::error('Erreur vérification PIN WhatsApp', [
                'phone' => $phoneNumber,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de la vérification du code'
            ];
        }
    }

    /**
     * Générer le message de bienvenue après authentification
     */
    protected function generateWelcomeMessage(?int $userId): string
    {
        $user = $userId ? \App\Models\User::find($userId) : null;
        $userName = $user ? $user->name : 'cher utilisateur';

        $message = "🎉 Bienvenue {$userName} !\n\n";
        $message .= "Vous êtes maintenant connecté à votre assistant marketing IA.\n\n";
        $message .= "💡 Que puis-je faire pour vous ?\n";
        $message .= "• Générer du contenu : GENERATE POST facebook \"promotion été\"\n";
        $message .= "• Analyser vos performances : ANALYZE PERFORMANCE\n";
        $message .= "• Créer une campagne : CREATE CAMPAIGN \"Campagne Automne\"\n";
        $message .= "• Ou simplement me poser vos questions marketing\n\n";
        $message .= "Tapez AIDE pour voir toutes les commandes disponibles.";

        return $message;
    }

    /**
     * Vérifier si une session WhatsApp est active
     */
    public function isSessionActive(string $phoneNumber): bool
    {
        $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);
        
        return \App\Models\WhatsAppAuthSession::where('phone_number', $normalizedPhone)
            ->where('is_verified', true)
            ->where('expires_at', '>', now())
            ->exists();
    }

    /**
     * Obtenir la session WhatsApp active
     */
    public function getActiveSession(string $phoneNumber): ?\App\Models\WhatsAppAuthSession
    {
        $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);
        
        return \App\Models\WhatsAppAuthSession::where('phone_number', $normalizedPhone)
            ->where('is_verified', true)
            ->where('expires_at', '>', now())
            ->first();
    }

    /**
     * Déconnecter une session WhatsApp
     */
    public function disconnectSession(string $phoneNumber): array
    {
        try {
            $normalizedPhone = $this->normalizePhoneNumber($phoneNumber);
            
            $session = $this->getActiveSession($normalizedPhone);
            if (!$session) {
                return [
                    'success' => false,
                    'error' => 'Aucune session active'
                ];
            }

            $session->delete();

            $this->sendMessage($normalizedPhone, "👋 Vous avez été déconnecté de votre assistant marketing. Merci d'avoir utilisé HelloBoost !");

            Log::info('Session WhatsApp déconnectée', [
                'phone' => $normalizedPhone,
                'session_id' => $session->id
            ]);

            return [
                'success' => true,
                'message' => 'Session déconnectée avec succès'
            ];

        } catch (\Exception $e) {
            Log::error('Erreur déconnexion session WhatsApp', [
                'phone' => $phoneNumber,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'error' => 'Erreur lors de la déconnexion'
            ];
        }
    }

    /**
     * Normaliser un numéro de téléphone
     */
    protected function normalizePhoneNumber(string $phoneNumber): string
    {
        // Supprimer tous les caractères non numériques sauf le +
        $cleaned = preg_replace('/[^+\d]/', '', $phoneNumber);
        
        // Si le numéro ne commence pas par +, l'ajouter
        if (!str_starts_with($cleaned, '+')) {
            // Si ça commence par 00, remplacer par +
            if (str_starts_with($cleaned, '00')) {
                $cleaned = '+' . substr($cleaned, 2);
            } else {
                // Supposer que c'est un numéro français si pas de préfixe international
                $cleaned = '+33' . ltrim($cleaned, '0');
            }
        }

        return $cleaned;
    }

    /**
     * Valider un numéro de téléphone
     */
    public function validatePhoneNumber(string $phoneNumber): array
    {
        try {
            $normalized = $this->normalizePhoneNumber($phoneNumber);
            
            // Vérifications basiques
            if (strlen($normalized) < 10 || strlen($normalized) > 15) {
                return [
                    'valid' => false,
                    'error' => 'Numéro de téléphone invalide'
                ];
            }

            // Vérifier avec l'API Twilio Lookup (optionnel)
            if (config('services.twilio.lookup_enabled', false)) {
                $lookupService = $this->client->lookups->v1->phoneNumbers($normalized);
                $number = $lookupService->fetch(['type' => 'carrier']);
                
                return [
                    'valid' => true,
                    'normalized' => $normalized,
                    'carrier' => $number->carrier['name'] ?? null,
                    'type' => $number->carrier['type'] ?? null
                ];
            }

            return [
                'valid' => true,
                'normalized' => $normalized
            ];

        } catch (\Exception $e) {
            return [
                'valid' => false,
                'error' => 'Impossible de valider le numéro'
            ];
        }
    }

    /**
     * Obtenir les statistiques d'authentification WhatsApp
     */
    public static function getAuthStats(?int $userId = null): array
    {
        $query = \App\Models\WhatsAppAuthSession::query();
        
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $totalSessions = $query->count();
        $activeSessions = $query->where('is_verified', true)
            ->where('expires_at', '>', now())
            ->count();
        $verifiedSessions = $query->where('is_verified', true)->count();
        
        $successRate = $totalSessions > 0 
            ? round(($verifiedSessions / $totalSessions) * 100, 1)
            : 0;

        return [
            'total_sessions' => $totalSessions,
            'active_sessions' => $activeSessions,
            'verified_sessions' => $verifiedSessions,
            'success_rate' => $successRate,
            'total_messages' => $query->sum('total_messages'),
            'avg_session_duration' => $query->where('is_verified', true)
                ->whereNotNull('verified_at')
                ->avg(\DB::raw('TIMESTAMPDIFF(MINUTE, verified_at, COALESCE(expires_at, NOW()))')) ?? 0
        ];
    }

    /**
     * Nettoyer les sessions expirées
     */
    public static function cleanExpiredSessions(): int
    {
        return \App\Models\WhatsAppAuthSession::where('expires_at', '<', now())->delete();
    }
