# 🚀 Script de Configuration PowerShell - Assistant Marketing Digital
# Ce script configure et vérifie tous les composants du système marketing

Write-Host "🚀 Configuration de l'Assistant Marketing Digital..." -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue

# Fonction pour afficher les étapes
function Print-Step($message) {
    Write-Host "`n▶ $message" -ForegroundColor Blue
}

function Print-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Print-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Print-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

# 1. Vérification des prérequis
Print-Step "1. Vérification des prérequis"

try {
    php -v | Out-Null
    Print-Success "PHP installé"
} catch {
    Print-Error "PHP n'est pas installé ou n'est pas dans le PATH"
    exit 1
}

try {
    composer --version | Out-Null
    Print-Success "Composer installé"
} catch {
    Print-Error "Composer n'est pas installé ou n'est pas dans le PATH"
    exit 1
}

try {
    npm --version | Out-Null
    Print-Success "npm installé"
} catch {
    Print-Error "npm n'est pas installé ou n'est pas dans le PATH"
    exit 1
}

Print-Success "Prérequis validés"

# 2. Installation des dépendances PHP
Print-Step "2. Vérification des packages PHP"

$composerList = composer show 2>$null
if (-not ($composerList -match "openai-php/laravel")) {
    Print-Warning "Installation du package OpenAI Laravel..."
    composer require openai-php/laravel
}

if (-not ($composerList -match "twilio/sdk")) {
    Print-Warning "Installation du package Twilio SDK..."
    composer require twilio/sdk
}

if (-not ($composerList -match "intervention/image")) {
    Print-Warning "Installation du package Intervention Image..."
    composer require intervention/image
}

Print-Success "Packages PHP vérifiés"

# 3. Installation des dépendances JavaScript
Print-Step "3. Vérification des packages JavaScript"

try {
    npm list lucide-react 2>$null | Out-Null
    Print-Success "Lucide React installé"
} catch {
    Print-Warning "Installation de Lucide React..."
    npm install lucide-react
}

try {
    npm list recharts 2>$null | Out-Null
    Print-Success "Recharts installé"
} catch {
    Print-Warning "Installation de Recharts..."
    npm install recharts
}

Print-Success "Packages JavaScript vérifiés"

# 4. Publication des configurations
Print-Step "4. Publication des configurations"

if (-not (Test-Path "config/openai.php")) {
    Print-Warning "Publication de la configuration OpenAI..."
    php artisan vendor:publish --provider="OpenAI\Laravel\ServiceProvider" --tag="openai-config"
}

Print-Success "Configurations publiées"

# 5. Migrations de base de données
Print-Step "5. Vérification des migrations"

$migrationStatus = php artisan migrate:status 2>$null
if (-not ($migrationStatus -match "marketing")) {
    Print-Warning "Exécution des migrations marketing..."
    php artisan migrate --force
}

Print-Success "Migrations vérifiées"

# 6. Nettoyage et optimisation
Print-Step "6. Nettoyage et optimisation"

php artisan config:clear
php artisan route:clear  
php artisan view:clear
php artisan cache:clear

php artisan config:cache
php artisan route:cache
php artisan optimize

Print-Success "Optimisations appliquées"

# 7. Vérification des services
Print-Step "7. Vérification des services"

# Test de la configuration Twilio
$twilioTest = php artisan tinker --execute="echo config('services.twilio.sid');" 2>$null
if ($twilioTest -match "AC") {
    Print-Success "Configuration Twilio détectée"
} else {
    Print-Warning "Configuration Twilio manquante - Ajoutez TWILIO_SID et TWILIO_TOKEN dans .env"
}

Print-Success "Services vérifiés"

# 8. Test des commandes marketing
Print-Step "8. Test des commandes marketing"

$artisanList = php artisan list 2>$null
if ($artisanList -match "marketing:automation") {
    Print-Success "Commande marketing:automation disponible"
} else {
    Print-Warning "Commande marketing:automation non trouvée"
}

Print-Success "Commandes testées"

# 9. Création des répertoires nécessaires
Print-Step "9. Création des répertoires"

$directories = @(
    "storage/app/public/marketing/flyers",
    "storage/app/public/marketing/generated-content", 
    "storage/app/public/marketing/exports"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

php artisan storage:link 2>$null

Print-Success "Répertoires créés"

# 10. Compilation des assets
Print-Step "10. Compilation des assets frontend"

if ((Test-Path "vite.config.js") -or (Test-Path "vite.config.ts")) {
    Print-Warning "Compilation des assets avec Vite..."
    npm run build
    Print-Success "Assets compilés"
} else {
    Print-Warning "Configuration Vite non trouvée - Compilation manuelle nécessaire"
}

# 11. Rapport final
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 Configuration terminée !" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Affichage des prochaines étapes
Write-Host "📋 Prochaines étapes :" -ForegroundColor Blue
Write-Host ""
Write-Host "1. 🔧 Configuration des services externes :"
Write-Host "   - Ajoutez votre TWILIO_SID et TWILIO_TOKEN dans .env"
Write-Host "   - Ajoutez votre OPENAI_API_KEY dans .env"
Write-Host "   - Configurez TWILIO_WHATSAPP_NUMBER dans .env"
Write-Host ""
Write-Host "2. 🗃️ Configuration base de données :"
Write-Host "   - Vérifiez que les migrations sont appliquées"
Write-Host "   - Testez les modèles marketing"
Write-Host ""
Write-Host "3. 🧪 Tests de fonctionnalités :"
Write-Host "   - Testez l'authentification WhatsApp"
Write-Host "   - Vérifiez la génération de contenu IA"
Write-Host "   - Testez le générateur de flyers"
Write-Host ""
Write-Host "4. 🚀 Démarrage de l'application :"
Write-Host "   - php artisan serve"
Write-Host "   - Accédez à /marketing/dashboard"
Write-Host ""

# Vérification des variables d'environnement critiques
Write-Host "🔍 Variables d'environnement critiques :" -ForegroundColor Blue

if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    
    if ($envContent -match "TWILIO_SID=") {
        Print-Success "TWILIO_SID configuré"
    } else {
        Print-Warning "TWILIO_SID manquant dans .env"
    }
    
    if ($envContent -match "OPENAI_API_KEY=") {
        Print-Success "OPENAI_API_KEY configuré"
    } else {
        Print-Warning "OPENAI_API_KEY manquant dans .env"
    }
    
    if ($envContent -match "DB_CONNECTION=") {
        Print-Success "Base de données configurée"
    } else {
        Print-Warning "Configuration base de données à vérifier"
    }
} else {
    Print-Warning "Fichier .env non trouvé"
}

Write-Host ""
Write-Host "Assistant Marketing Digital prêt à l'emploi ! 🚀" -ForegroundColor Green
Write-Host ""

# Exemple de fichier .env
if (-not (Test-Path ".env.marketing.example")) {
    Print-Step "Création du fichier d'exemple .env.marketing.example"
    
    $envExample = @"
# Configuration Marketing Digital - HelloBoost Customer Care

# Twilio (WhatsApp Business)
TWILIO_SID=your_twilio_sid_here
TWILIO_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number_here

# OpenAI (Intelligence Artificielle)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=2000

# Facebook/Instagram (optionnel)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id

# Instagram (optionnel) 
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token

# Configuration marketing
MARKETING_AI_ENABLED=true
MARKETING_WHATSAPP_ENABLED=true
MARKETING_AUTOMATION_ENABLED=true
MARKETING_FLYER_GENERATOR_ENABLED=true

# Limites et quotas
MARKETING_DAILY_MESSAGE_LIMIT=1000
MARKETING_MONTHLY_AI_REQUESTS_LIMIT=10000
MARKETING_MAX_CLIENTS_PER_USER=5000

# Cache et performance
MARKETING_CACHE_ENABLED=true
MARKETING_CACHE_TTL=3600

# Webhooks
MARKETING_WEBHOOK_SECRET=your_webhook_secret_here
"@

    $envExample | Out-File -FilePath ".env.marketing.example" -Encoding UTF8
    Print-Success "Fichier .env.marketing.example créé"
}

Write-Host "Script terminé avec succès !" -ForegroundColor Green