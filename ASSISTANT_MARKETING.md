# 🚀 Assistant Marketing Digital

Votre solution complète pour l'automatisation du marketing digital, la génération de contenu IA et la gestion des communications clients.

## 🌟 Fonctionnalités Principales

### 📱 Communication WhatsApp
- **Intégration WhatsApp Business** via Twilio
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

## 🛠️ Installation et Configuration

### 1. Dépendances
```bash
# Installation des dépendances PHP
composer install

# Installation des dépendances JavaScript
npm install
```

### 2. Configuration de Base
```bash
# Copier le fichier de configuration
cp .env.example .env

# Générer la clé d'application
php artisan key:generate

# Créer les tables
php artisan migrate

# Créer les liens symboliques
php artisan storage:link
```

### 3. Configuration des Services

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

#### APIs Réseaux Sociaux (Optionnel)
```env
# Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token

# Twitter/X
TWITTER_API_KEY=your_twitter_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token
```

### 4. Configuration des Tâches Automatisées
```bash
# Ajouter au crontab
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## 📋 Utilisation

### 🗣️ Chat IA
1. Accédez à `/assistant-marketing/chat`
2. Posez des questions sur le marketing
3. Demandez de générer du contenu
4. Obtenez des conseils personnalisés

### 📝 Génération de Contenu
```javascript
// Exemple d'utilisation via API
fetch('/assistant-marketing/generate-content', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': token
    },
    body: JSON.stringify({
        type: 'post',
        topic: 'Promotion été 2024',
        tone: 'enjoué',
        platforms: ['facebook', 'instagram'],
        target_audience: 'jeunes adultes'
    })
})
```

### 📱 Envoi WhatsApp
```php
// Envoi de message simple
$whatsappService = app(WhatsAppService::class);
$whatsappService->sendMessage($client, "Bonjour ! Comment allez-vous ?");

// Envoi en masse avec personnalisation IA
$whatsappService->sendBulkMessage($clientIds, $message, $userId);
```

### 🎨 Création de Flyers
1. Allez dans `/flyers/create`
2. Choisissez un format
3. Générez le contenu avec l'IA
4. Personnalisez le design
5. Exportez en haute qualité

### ⚡ Automatisation
```php
// Créer une règle d'anniversaire
$automationService->createSeasonalReminder(
    'Anniversaire Client',
    '01-01', // Format MM-DD
    'Joyeux anniversaire {nom} ! 🎉'
);

// Exécuter les règles
php artisan marketing:automation
```

## 🔧 Commandes Artisan

### Automatisation Marketing
```bash
# Exécuter toutes les automatisations
php artisan marketing:automation

# Exécuter seulement les règles
php artisan marketing:automation --rules

# Publier les posts programmés
php artisan marketing:automation --posts

# Créer les rappels saisonniers
php artisan marketing:seasonal-reminders
```

## 🎯 Exemples d'Utilisation

### Campagne d'Anniversaire Automatisée
```php
// Créer une règle d'automatisation
AutomationRule::create([
    'user_id' => 1,
    'name' => 'Anniversaires Clients',
    'trigger_type' => 'birthday',
    'trigger_conditions' => ['days_ahead' => 0],
    'action_type' => 'send_whatsapp',
    'action_data' => [
        'message' => '🎉 Joyeux anniversaire {nom} ! Profitez de 20% de réduction avec le code ANNIV20',
        'use_ai' => true
    ],
    'status' => 'active'
]);
```

### Génération d'Article Blog
```php
$aiService = app(AIContentService::class);
$result = $aiService->generateArticle(
    'Les tendances marketing 2024',
    'marketing digital, réseaux sociaux, intelligence artificielle',
    1200,
    'informatif'
);
```

### Message WhatsApp Personnalisé
```php
$result = $aiService->generatePersonalizedMessage(
    $client,
    'promotion_été',
    $template
);

if ($result['success']) {
    $whatsappService->sendMessage($client, $result['message']);
}
```

## 🚨 Automatisations Prêtes à l'Emploi

### Rappels Saisonniers Automatiques
- 🎊 **Nouvel An** (1er janvier)
- 💝 **Saint-Valentin** (14 février)
- 👩 **Fête des Mères** (dernier dimanche de mai)
- 👨 **Fête des Pères** (3ème dimanche de juin)
- 🎒 **Rentrée** (1er septembre)
- 🎃 **Halloween** (31 octobre)
- 🎄 **Noël** (25 décembre)

### Déclencheurs Automatiques
- **Anniversaires clients** (avec délai personnalisable)
- **Nouveaux clients** (message de bienvenue)
- **Clients inactifs** (réactivation)
- **Événements saisonniers**
- **Dates personnalisées**

## 📈 Métriques et Analytics

### Tableaux de Bord Disponibles
- **Clients actifs** vs inactifs
- **Messages envoyés** par période
- **Taux d'engagement** WhatsApp
- **Performance des campagnes**
- **Utilisation des templates**
- **Statistiques d'automatisation**

## 🔐 Sécurité et Conformité

### Protection des Données
- **Opt-out automatique** pour WhatsApp
- **Gestion RGPD** intégrée
- **Chiffrement** des communications
- **Logs d'audit** complets

### Limites et Quotas
- **Respect des limites** API Twilio
- **Délais anti-spam** intégrés
- **Validation** des numéros de téléphone
- **Gestion des erreurs** robuste

## 🆘 Dépannage

### Problèmes Courants

#### WhatsApp ne fonctionne pas
```bash
# Vérifier la configuration Twilio
php artisan tinker
>>> config('services.twilio')

# Tester l'envoi
>>> app(App\Services\WhatsAppService::class)->sendMessage($client, "Test")
```

#### IA ne génère pas de contenu
```bash
# Vérifier la clé OpenAI
>>> config('services.openai.api_key')

# Tester l'API
>>> app(App\Services\AIContentService::class)->generateChatResponse("Bonjour")
```

#### Automatisations non exécutées
```bash
# Vérifier le cron
php artisan schedule:list

# Exécuter manuellement
php artisan marketing:automation --all
```

## 🚀 Fonctionnalités Avancées

### Webhooks WhatsApp
```php
// Configurez l'URL webhook dans Twilio
POST /webhooks/whatsapp
```

### Personnalisation IA Avancée
```php
// Utiliser des templates avec variables
$template = ContentTemplate::create([
    'content_structure' => 'Bonjour {nom}, découvrez {produit} avec {reduction}% de réduction !',
    'variables' => ['nom', 'produit', 'reduction'],
    'default_values' => ['produit' => 'nos nouveautés', 'reduction' => '10']
]);
```

### Intégration API Complète
```php
// Toutes les fonctionnalités sont accessibles via API REST
// Documentation complète dans /api/documentation
```

## 📞 Support

Pour toute question ou assistance :
- 📧 **Email** : support@votre-domaine.com
- 💬 **Chat** : Utilisez le chat IA intégré
- 📚 **Documentation** : Consultez ce guide
- 🐛 **Bugs** : Créez une issue GitHub

---

## 🎉 Prochaines Fonctionnalités

- [ ] **Intégration TikTok** Business
- [ ] **Analyseur de sentiment** IA
- [ ] **Chatbot vocal** WhatsApp
- [ ] **Templates vidéo** automatisés
- [ ] **A/B Testing** intégré
- [ ] **Recommandations IA** avancées

**Transformez votre marketing digital dès aujourd'hui !** 🚀