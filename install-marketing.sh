#!/bin/bash

# ============================================================================
# SCRIPT D'INSTALLATION - ASSISTANT MARKETING DIGITAL
# ============================================================================
# Ce script automatise l'installation et la configuration du système

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si on est dans le bon répertoire
if [ ! -f "composer.json" ]; then
    print_error "Ce script doit être exécuté depuis la racine du projet Laravel"
    exit 1
fi

print_status "🚀 Démarrage de l'installation de l'Assistant Marketing Digital..."

# ============================================================================
# ÉTAPE 1: Vérification des prérequis
# ============================================================================
print_status "📋 Vérification des prérequis..."

# Vérifier PHP
if ! command -v php &> /dev/null; then
    print_error "PHP n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

PHP_VERSION=$(php -r "echo PHP_VERSION;")
print_success "PHP version $PHP_VERSION détecté"

# Vérifier Composer
if ! command -v composer &> /dev/null; then
    print_error "Composer n'est pas installé ou n'est pas dans le PATH"
    exit 1
fi

print_success "Composer détecté"

# Vérifier Node.js et npm
if ! command -v node &> /dev/null; then
    print_warning "Node.js n'est pas installé. Certaines fonctionnalités frontend peuvent ne pas fonctionner."
else
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION détecté"
fi

# ============================================================================
# ÉTAPE 2: Installation des dépendances PHP
# ============================================================================
print_status "📦 Installation des dépendances PHP..."

if [ -f "composer.lock" ]; then
    print_status "Mise à jour des dépendances existantes..."
    composer update
else
    print_status "Installation des nouvelles dépendances..."
    composer install
fi

print_success "Dépendances PHP installées"

# ============================================================================
# ÉTAPE 3: Installation des dépendances JavaScript
# ============================================================================
if command -v npm &> /dev/null; then
    print_status "📦 Installation des dépendances JavaScript..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dépendances JavaScript installées"
else
    print_warning "npm non disponible, étape JavaScript ignorée"
fi

# ============================================================================
# ÉTAPE 4: Configuration de l'environnement
# ============================================================================
print_status "⚙️  Configuration de l'environnement..."

# Copier le fichier d'environnement marketing
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Fichier .env créé à partir de .env.example"
    else
        print_warning "Aucun fichier .env.example trouvé, création manuelle requise"
    fi
else
    print_status "Fichier .env déjà présent"
fi

# Copier le fichier d'environnement marketing
if [ -f ".env.marketing.example" ]; then
    cp .env.marketing.example .env.marketing
    print_success "Fichier .env.marketing créé"
    print_warning "⚠️  IMPORTANT: Configurez vos clés API dans .env.marketing"
else
    print_warning "Fichier .env.marketing.example non trouvé"
fi

# ============================================================================
# ÉTAPE 5: Génération de la clé d'application
# ============================================================================
print_status "🔑 Génération de la clé d'application..."

if [ ! -f ".env" ] || ! grep -q "APP_KEY=base64:" .env; then
    php artisan key:generate
    print_success "Clé d'application générée"
else
    print_status "Clé d'application déjà présente"
fi

# ============================================================================
# ÉTAPE 6: Exécution des migrations
# ============================================================================
print_status "🗄️  Exécution des migrations de base..."

# Vérifier si la base de données est configurée
if php artisan migrate:status &> /dev/null; then
    print_status "Exécution des migrations..."
    php artisan migrate --force
    print_success "Migrations exécutées"
else
    print_warning "Impossible de se connecter à la base de données"
    print_warning "Configurez votre base de données dans .env avant de continuer"
fi

# ============================================================================
# ÉTAPE 7: Création des liens symboliques
# ============================================================================
print_status "🔗 Création des liens symboliques..."

if [ ! -L "public/storage" ]; then
    php artisan storage:link
    print_success "Liens symboliques créés"
else
    print_status "Liens symboliques déjà présents"
fi

# ============================================================================
# ÉTAPE 8: Création des dossiers de stockage
# ============================================================================
print_status "📁 Création des dossiers de stockage..."

# Créer les dossiers pour les flyers
mkdir -p storage/app/public/flyers/previews
mkdir -p storage/app/public/flyers/exports
mkdir -p storage/app/public/flyers/templates

# Créer les dossiers pour les médias
mkdir -p storage/app/public/media/clients
mkdir -p storage/app/public/media/campaigns
mkdir -p storage/app/public/media/templates

print_success "Dossiers de stockage créés"

# ============================================================================
# ÉTAPE 9: Vérification des services
# ============================================================================
print_status "🔍 Vérification des services..."

# Vérifier si les commandes marketing sont disponibles
if php artisan list | grep -q "marketing:"; then
    print_success "Commandes marketing disponibles"
else
    print_warning "Commandes marketing non trouvées"
fi

# ============================================================================
# ÉTAPE 10: Configuration du cron
# ============================================================================
print_status "⏰ Configuration du cron..."

CRON_JOB="* * * * * cd $(pwd) && php artisan schedule:run >> /dev/null 2>&1"

if crontab -l 2>/dev/null | grep -q "schedule:run"; then
    print_status "Tâche cron déjà configurée"
else
    print_warning "⚠️  IMPORTANT: Ajoutez cette ligne à votre crontab :"
    echo "    $CRON_JOB"
    echo ""
    print_warning "Ou exécutez : crontab -e"
fi

# ============================================================================
# ÉTAPE 11: Optimisation et cache
# ============================================================================
print_status "⚡ Optimisation et cache..."

# Vider les caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Optimiser l'application
php artisan optimize

print_success "Application optimisée"

# ============================================================================
# ÉTAPE 12: Tests de base
# ============================================================================
print_status "🧪 Tests de base..."

# Tester la configuration
if php artisan config:cache &> /dev/null; then
    print_success "Configuration valide"
else
    print_error "Erreur dans la configuration"
fi

# ============================================================================
# ÉTAPE 13: Création des règles d'automatisation par défaut
# ============================================================================
print_status "🔧 Création des règles d'automatisation par défaut..."

# Demander à l'utilisateur s'il veut créer les règles par défaut
read -p "Voulez-vous créer les règles d'automatisation saisonnières par défaut ? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    if php artisan marketing:seasonal-reminders --create-defaults --dry-run &> /dev/null; then
        print_success "Règles d'automatisation créées"
    else
        print_warning "Impossible de créer les règles d'automatisation"
    fi
else
    print_status "Création des règles d'automatisation ignorée"
fi

# ============================================================================
# ÉTAPE 14: Finalisation
# ============================================================================
print_success "🎉 Installation terminée avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Configurez vos clés API dans .env.marketing"
echo "2. Testez les services : php artisan marketing:test-services"
echo "3. Créez votre premier client : php artisan tinker"
echo "4. Testez WhatsApp : php artisan marketing:whatsapp:test"
echo "5. Testez l'IA : php artisan marketing:ai:test"
echo ""
echo "🚀 Pour démarrer l'application :"
echo "   php artisan serve"
echo ""
echo "📊 Pour surveiller les automatisations :"
echo "   php artisan marketing:automation --verbose"
echo ""
echo "🔧 Pour créer les règles saisonnières :"
echo "   php artisan marketing:seasonal-reminders --create-defaults"
echo ""

# ============================================================================
# ÉTAPE 15: Vérification finale
# ============================================================================
print_status "🔍 Vérification finale..."

# Vérifier les permissions
if [ -w "storage" ] && [ -w "bootstrap/cache" ]; then
    print_success "Permissions correctes"
else
    print_warning "Vérifiez les permissions des dossiers storage et bootstrap/cache"
fi

# Vérifier la connectivité de base
if php artisan route:list | grep -q "marketing"; then
    print_success "Routes marketing disponibles"
else
    print_warning "Routes marketing non trouvées"
fi

print_success "✅ Installation et configuration terminées !"
echo ""
echo "🎯 Votre Assistant Marketing Digital est prêt à l'emploi !"
echo ""
echo "📚 Documentation : consultez le fichier ASSISTANT_MARKETING.md"
echo "🆘 Support : créez une issue sur GitHub en cas de problème"
echo ""
echo "🌟 Bon marketing !"