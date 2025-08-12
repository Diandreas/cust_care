# 🚀 Assistant Marketing Digital - Guide Complet

Votre solution complète pour l'automatisation du marketing digital, la génération de contenu IA et la gestion des communications clients.

## 🌟 Fonctionnalités Principales

### 📱 Communication WhatsApp Business
- **Intégration WhatsApp** via Twilio
- **Conversations en temps réel** avec vos clients
- **Réponses automatiques** intelligentes
- **Messages en masse** avec personnalisation IA
- **Gestion opt-in/opt-out** automatique

### 🤖 Génération de Contenu IA
- **Posts réseaux sociaux** optimisés par plateforme
- **Articles de blog** SEO-friendly
- **Messages personnalisés** pour chaque client
- **Contenu de flyers** créatif et professionnel
- **Optimisation automatique** du contenu

### 🎨 Générateur de Flyers
- **Templates professionnels** pré-conçus
- **Éditeur visuel** simple et intuitif
- **Multiple formats** (A4, A5, carré, story, post)
- **Export** en PNG, JPG ou PDF
- **Génération IA** du contenu visuel

### 📅 Planification et Automatisation
- **Programmation** des publications
- **Rappels automatiques** d'anniversaires
- **Messages saisonniers** (Noël, Nouvel An, etc.)
- **Règles d'automatisation** personnalisables
- **Suivi des performances**

### 📊 Tableaux de Bord
- **Métriques marketing** en temps réel
- **Statistiques d'engagement**
- **Suivi des campagnes**
- **Analyse des performances**

## 🛠️ Installation Rapide

### 1. Installation Automatique (Recommandé)
```bash
# Rendre le script exécutable
chmod +x install-marketing.sh

# Exécuter l'installation
./install-marketing.sh
```

### 2. Installation Manuelle
```bash
# Installation des dépendances
composer install
npm install

# Configuration
cp .env.marketing.example .env.marketing
cp .env.example .env

# Génération de la clé
php artisan key:generate

# Migrations
php artisan migrate

# Liens symboliques
php artisan storage:link

# Optimisation
php artisan optimize
```

## ⚙️ Configuration

### 1. Variables d'Environnement Essentielles

#### OpenAI (Requis pour l'IA)
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
```

#### Twilio WhatsApp (Requis pour WhatsApp)
```env
TWILIO_SID=your_twilio_sid_here
TWILIO_TOKEN=your_twilio_auth_token_here
TWILIO_FROM=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### 2. Configuration des Services
```env
# WhatsApp
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=twilio

# Intelligence Artificielle
AI_ENABLED=true
AI_PROVIDER=openai

# Automatisations
AUTOMATION_ENABLED=true
AUTOMATION_EXECUTION_FREQUENCY=hourly
```

## 🚀 Utilisation

### 1. Commandes Artisan Principales

#### Automatisation Marketing
```bash
# Exécuter toutes les automatisations
php artisan marketing:automation

# Exécuter seulement les règles d'anniversaire
php artisan marketing:automation --type=birthday

# Mode test sans exécution
php artisan marketing:automation --dry-run --verbose
```

#### Rappels Saisonniers
```bash
# Créer les règles saisonnières par défaut
php artisan marketing:seasonal-reminders --create-defaults

# Exécuter les rappels saisonniers
php artisan marketing:seasonal-reminders

# Mode test
php artisan marketing:seasonal-reminders --dry-run --verbose
```

#### Tests des Services
```bash
# Tester tous les services
php artisan marketing:test-services

# Tester WhatsApp
php artisan marketing:whatsapp:test

# Tester l'IA
php artisan marketing:ai:test
```

### 2. API Endpoints

#### Tableau de Bord
```http
GET /api/marketing/dashboard
GET /api/marketing/stats
GET /api/marketing/config
```

#### Gestion des Clients
```http
GET    /api/marketing/clients
POST   /api/marketing/clients
GET    /api/marketing/clients/{id}
PUT    /api/marketing/clients/{id}
DELETE /api/marketing/clients/{id}
```

#### Gestion des Campagnes
```http
GET    /api/marketing/campaigns
POST   /api/marketing/campaigns
POST   /api/marketing/campaigns/{id}/start
POST   /api/marketing/campaigns/{id}/pause
POST   /api/marketing/campaigns/{id}/schedule
```

#### Automatisations
```http
GET    /api/marketing/automations
POST   /api/marketing/automations
POST   /api/marketing/automations/birthday-rule
POST   /api/marketing/automations/seasonal-rule
POST   /api/marketing/automations/new-client-rule
```

#### Assistant IA
```http
POST   /api/marketing/ai/chat
POST   /api/marketing/ai/generate-content
POST   /api/marketing/ai/generate-article
POST   /api/marketing/ai/generate-social-post
POST   /api/marketing/ai/generate-flyer-content
```

#### WhatsApp Business
```http
POST   /api/marketing/whatsapp/send-message
POST   /api/marketing/whatsapp/send-bulk
POST   /api/marketing/whatsapp/send-campaign
GET    /api/marketing/whatsapp/conversations
GET    /api/marketing/whatsapp/stats
```

### 3. Exemples d'Utilisation

#### Créer un Client et Envoyer un Message
```php
// Créer un client
$client = MarketingClient::create([
    'user_id' => auth()->id(),
    'name' => 'Jean Dupont',
    'phone' => '+33123456789',
    'email' => 'jean@example.com',
    'birthday' => '1990-05-15',
    'status' => 'active'
]);

// Envoyer un message WhatsApp
$whatsappService = app(WhatsAppService::class);
$result = $whatsappService->sendMessage($client, "Bonjour Jean ! Comment allez-vous ?");
```

#### Créer une Règle d'Automatisation
```php
$automationService = app(MarketingAutomationService::class);

// Règle d'anniversaire
$rule = $automationService->createBirthdayRule(
    auth()->id(),
    'Anniversaires Clients',
    [
        'days_ahead' => 0,
        'message' => '🎉 Joyeux anniversaire {nom} ! Profitez de 20% de réduction avec le code ANNIV20',
        'use_ai' => true
    ]
);
```

#### Générer du Contenu avec l'IA
```php
$aiService = app(AIContentService::class);

// Générer un post Instagram
$result = $aiService->generateSocialMediaPost(
    'Promotion été 2024',
    ['instagram'],
    'casual'
);

// Générer un article de blog
$article = $aiService->generateArticle(
    'Les tendances marketing 2024',
    'marketing digital, réseaux sociaux, intelligence artificielle',
    1200,
    'informatif'
);
```

#### Créer un Flyer
```php
$flyerService = app(FlyerGeneratorService::class);

$flyer = $flyerService->createFlyer(auth()->id(), [
    'name' => 'Promotion Été 2024',
    'format' => 'a4',
    'orientation' => 'portrait',
    'ai_generation' => [
        'enabled' => true,
        'topic' => 'Promotion été avec 30% de réduction',
        'requirements' => ['couleurs_vives', 'appel_action']
    ]
]);

// Générer l'aperçu
$previewUrl = $flyerService->generatePreview($flyer);

// Exporter en PNG
$exportUrl = $flyerService->exportFlyer($flyer, 'png');
```

## 📅 Configuration des Tâches Automatisées

### 1. Cron (Linux/Mac)
```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### 2. Task Scheduler Windows
```cmd
# Créer un fichier .bat
echo "cd /d C:\path-to-your-project && php artisan schedule:run" > marketing-scheduler.bat

# Programmer la tâche (toutes les minutes)
schtasks /create /tn "Marketing Scheduler" /tr "C:\path-to-your-project\marketing-scheduler.bat" /sc minute /mo 1
```

### 3. Vérification du Planning
```bash
# Voir les tâches programmées
php artisan schedule:list

# Tester le planning
php artisan schedule:test
```

## 🔧 Maintenance et Surveillance

### 1. Logs et Monitoring
```bash
# Voir les logs des automatisations
tail -f storage/logs/laravel.log | grep "marketing"

# Vérifier les queues
php artisan queue:work --verbose

# Surveiller Horizon (si installé)
php artisan horizon:status
```

### 2. Nettoyage et Optimisation
```bash
# Nettoyer les anciennes règles
php artisan marketing:automation:cleanup

# Optimiser la base de données
php artisan optimize

# Vider les caches
php artisan cache:clear
php artisan config:clear
```

### 3. Sauvegarde
```bash
# Sauvegarder la base de données
php artisan backup:run

# Exporter les données marketing
php artisan marketing:export-data
```

## 🚨 Dépannage

### Problèmes Courants

#### WhatsApp ne fonctionne pas
```bash
# Vérifier la configuration Twilio
php artisan tinker
>>> config('services.twilio')

# Tester l'envoi
>>> app(App\Services\WhatsAppService::class)->testConnection()
```

#### IA ne génère pas de contenu
```bash
# Vérifier la clé OpenAI
>>> config('services.openai.api_key')

# Tester l'API
>>> app(App\Services\AIContentService::class)->testConnection()
```

#### Automatisations non exécutées
```bash
# Vérifier le cron
php artisan schedule:list

# Exécuter manuellement
php artisan marketing:automation --all --verbose
```

#### Erreurs de base de données
```bash
# Vérifier les migrations
php artisan migrate:status

# Réparer les migrations
php artisan migrate:refresh
```

### Logs et Debug
```bash
# Activer le mode debug
APP_DEBUG=true

# Voir les logs en temps réel
tail -f storage/logs/laravel.log

# Tester la configuration
php artisan config:cache
php artisan route:cache
```

## 📚 Ressources et Support

### 1. Documentation
- **Guide Complet** : `ASSISTANT_MARKETING.md`
- **Configuration** : `config/marketing.php`
- **Variables d'environnement** : `.env.marketing.example`

### 2. Commandes Utiles
```bash
# Aide générale
php artisan list marketing

# Aide sur une commande spécifique
php artisan marketing:automation --help

# Voir les routes disponibles
php artisan route:list --name=marketing
```

### 3. Support
- **Issues GitHub** : Créez une issue pour les bugs
- **Documentation** : Consultez ce README et les fichiers de configuration
- **Tests** : Utilisez les commandes de test intégrées

## 🎯 Prochaines Étapes

### 1. Configuration Initiale
- [ ] Configurer vos clés API (Twilio, OpenAI)
- [ ] Créer vos premiers clients
- [ ] Tester les services de base
- [ ] Configurer le cron

### 2. Automatisations
- [ ] Créer les règles saisonnières par défaut
- [ ] Configurer les automatisations d'anniversaire
- [ ] Tester les envois automatiques
- [ ] Surveiller les performances

### 3. Optimisation
- [ ] Analyser les statistiques
- [ ] Ajuster les règles d'automatisation
- [ ] Personnaliser les templates
- [ ] Optimiser les performances

## 🌟 Fonctionnalités Avancées

### 1. Intégrations
- **Réseaux sociaux** : Facebook, Instagram, Twitter, LinkedIn
- **Email marketing** : Templates et campagnes automatisées
- **CRM** : Synchronisation avec vos outils existants
- **Analytics** : Intégration Google Analytics et Facebook Pixel

### 2. Personnalisation
- **Templates personnalisés** : Créez vos propres designs
- **Règles métier** : Automatisations spécifiques à votre secteur
- **Workflows** : Chaînes d'actions complexes
- **A/B Testing** : Testez différentes approches

### 3. Intelligence Artificielle
- **Apprentissage automatique** : Amélioration continue des performances
- **Analyse de sentiment** : Compréhension des réactions clients
- **Prédictions** : Anticipation des besoins clients
- **Optimisation automatique** : Ajustement des campagnes

---

**🎉 Félicitations ! Votre Assistant Marketing Digital est maintenant opérationnel !**

Transformez votre marketing digital dès aujourd'hui avec l'automatisation, l'IA et la personnalisation ! 🚀