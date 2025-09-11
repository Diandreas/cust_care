#!/bin/bash

# 🚀 Script de Configuration - Assistant Marketing Digital
# Ce script configure et vérifie tous les composants du système marketing

echo "🚀 Configuration de l'Assistant Marketing Digital..."
echo "=================================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les étapes
print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Vérification des prérequis
print_step "1. Vérification des prérequis"

if ! command -v php &> /dev/null; then
    print_error "PHP n'est pas installé"
    exit 1
fi

if ! command -v composer &> /dev/null; then
    print_error "Composer n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi

print_success "Prérequis validés"

# 2. Installation des dépendances PHP
print_step "2. Vérification des packages PHP"

# Vérifier si les packages sont installés
if ! composer show | grep -q "openai-php/laravel"; then
    print_warning "Installation du package OpenAI Laravel..."
    composer require openai-php/laravel
fi

if ! composer show | grep -q "twilio/sdk"; then
    print_warning "Installation du package Twilio SDK..."
    composer require twilio/sdk
fi

if ! composer show | grep -q "intervention/image"; then
    print_warning "Installation du package Intervention Image..."
    composer require intervention/image
fi

print_success "Packages PHP vérifiés"

# 3. Installation des dépendances JavaScript
print_step "3. Vérification des packages JavaScript"

if ! npm list lucide-react &> /dev/null; then
    print_warning "Installation de Lucide React..."
    npm install lucide-react
fi

if ! npm list recharts &> /dev/null; then
    print_warning "Installation de Recharts..."
    npm install recharts
fi

print_success "Packages JavaScript vérifiés"

# 4. Publication des configurations
print_step "4. Publication des configurations"

# Publier les configs OpenAI si nécessaire
if [ ! -f config/openai.php ]; then
    print_warning "Publication de la configuration OpenAI..."
    php artisan vendor:publish --provider="OpenAI\Laravel\ServiceProvider" --tag="openai-config"
fi

print_success "Configurations publiées"

# 5. Migrations de base de données
print_step "5. Vérification des migrations"

# Vérifier si les migrations marketing sont exécutées
php artisan migrate:status | grep -q "marketing" || {
    print_warning "Exécution des migrations marketing..."
    php artisan migrate --force
}

print_success "Migrations vérifiées"

# 6. Nettoyage et optimisation
print_step "6. Nettoyage et optimisation"

php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

php artisan config:cache
php artisan route:cache
php artisan optimize

print_success "Optimisations appliquées"

# 7. Vérification des services
print_step "7. Vérification des services"

# Test de la configuration Twilio
if php artisan tinker --execute="echo 'Twilio SID: ' . config('services.twilio.sid');" | grep -q "AC"; then
    print_success "Configuration Twilio détectée"
else
    print_warning "Configuration Twilio manquante - Ajoutez TWILIO_SID et TWILIO_TOKEN dans .env"
fi

# Test de la configuration OpenAI
if php artisan tinker --execute="echo 'OpenAI: ' . (config('services.openai.api_key') ? 'Configuré' : 'Non configuré');" | grep -q "Configuré"; then
    print_success "Configuration OpenAI détectée"
else
    print_warning "Configuration OpenAI manquante - Ajoutez OPENAI_API_KEY dans .env"
fi

print_success "Services vérifiés"

# 8. Test des commandes marketing
print_step "8. Test des commandes marketing"

if php artisan list | grep -q "marketing:automation"; then
    print_success "Commande marketing:automation disponible"
    
    # Tester la commande avec dry-run
    print_warning "Test de l'automatisation en mode simulation..."
    php artisan marketing:automation --dry-run 2>/dev/null && print_success "Test d'automatisation réussi" || print_warning "Test d'automatisation échoué - Vérifiez la configuration"
else
    print_warning "Commande marketing:automation non trouvée"
fi

print_success "Commandes testées"

# 9. Création des répertoires nécessaires
print_step "9. Création des répertoires"

mkdir -p storage/app/public/marketing/flyers
mkdir -p storage/app/public/marketing/generated-content
mkdir -p storage/app/public/marketing/exports

php artisan storage:link 2>/dev/null || true

print_success "Répertoires créés"

# 10. Compilation des assets
print_step "10. Compilation des assets frontend"

if [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then
    print_warning "Compilation des assets avec Vite..."
    npm run build
    print_success "Assets compilés"
else
    print_warning "Configuration Vite non trouvée - Compilation manuelle nécessaire"
fi

# 11. Rapport final
echo ""
echo "========================================"
echo -e "${GREEN}🎉 Configuration terminée !${NC}"
echo "========================================"
echo ""

# Affichage des prochaines étapes
echo -e "${BLUE}📋 Prochaines étapes :${NC}"
echo ""
echo "1. 🔧 Configuration des services externes :"
echo "   - Ajoutez votre TWILIO_SID et TWILIO_TOKEN dans .env"
echo "   - Ajoutez votre OPENAI_API_KEY dans .env"
echo "   - Configurez TWILIO_WHATSAPP_NUMBER dans .env"
echo ""
echo "2. 🗃️ Configuration base de données :"
echo "   - Vérifiez que les migrations sont appliquées"
echo "   - Testez les modèles marketing"
echo ""
echo "3. 🧪 Tests de fonctionnalités :"
echo "   - Testez l'authentification WhatsApp"
echo "   - Vérifiez la génération de contenu IA"
echo "   - Testez le générateur de flyers"
echo ""
echo "4. 🚀 Démarrage de l'application :"
echo "   - php artisan serve"
echo "   - Accédez à /marketing/dashboard"
echo ""

# Vérification des variables d'environnement critiques
echo -e "${BLUE}🔍 Variables d'environnement critiques :${NC}"

if grep -q "TWILIO_SID=" .env; then
    print_success "TWILIO_SID configuré"
else
    print_warning "TWILIO_SID manquant dans .env"
fi

if grep -q "OPENAI_API_KEY=" .env; then
    print_success "OPENAI_API_KEY configuré"
else
    print_warning "OPENAI_API_KEY manquant dans .env"
fi

if grep -q "DB_CONNECTION=" .env; then
    print_success "Base de données configurée"
else
    print_warning "Configuration base de données à vérifier"
fi

echo ""
echo -e "${GREEN}Assistant Marketing Digital prêt à l'emploi ! 🚀${NC}"
echo ""

# Exemple de fichier .env
if [ ! -f ".env.marketing.example" ]; then
    print_step "Création du fichier d'exemple .env.marketing.example"
    
    cat > .env.marketing.example << 'EOL'
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
EOL

    print_success "Fichier .env.marketing.example créé"
fi

exit 0