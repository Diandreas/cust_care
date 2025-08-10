#!/bin/bash

echo "🚀 Installation de l'Assistant Marketing Digital"
echo "============================================="

# Vérifier si PHP est installé
if ! command -v php &> /dev/null; then
    echo "❌ PHP n'est pas installé. Veuillez installer PHP 8.2 ou plus récent."
    exit 1
fi

# Vérifier si Composer est installé
if ! command -v composer &> /dev/null; then
    echo "❌ Composer n'est pas installé. Veuillez installer Composer."
    exit 1
fi

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js."
    exit 1
fi

echo "✅ Prérequis validés"

# Installation des dépendances PHP
echo "📦 Installation des dépendances PHP..."
composer install --optimize-autoloader

# Installation des dépendances JavaScript
echo "📦 Installation des dépendances JavaScript..."
npm install

# Copier le fichier .env si il n'existe pas
if [ ! -f .env ]; then
    echo "📄 Création du fichier .env..."
    cp .env.example .env
    echo "⚠️  N'oubliez pas de configurer vos clés API dans le fichier .env"
fi

# Générer la clé d'application
echo "🔑 Génération de la clé d'application..."
php artisan key:generate

# Créer les liens symboliques
echo "🔗 Création des liens symboliques..."
php artisan storage:link

# Exécuter les migrations
echo "🗄️  Exécution des migrations..."
php artisan migrate --force

# Exécuter les seeders
echo "🌱 Ajout des templates de base..."
php artisan db:seed --class=ContentTemplateSeeder

# Créer les dossiers nécessaires
echo "📁 Création des dossiers..."
mkdir -p storage/app/temp
mkdir -p storage/app/flyers
mkdir -p storage/app/media

# Installer les règles d'automatisation saisonnières
echo "⚡ Installation des rappels saisonniers..."
php artisan marketing:seasonal-reminders

# Build des assets (si en production)
if [ "$1" == "--production" ]; then
    echo "🏗️  Build des assets pour la production..."
    npm run build
else
    echo "🔧 Mode développement - utilisez 'npm run dev' pour le hot reload"
fi

echo ""
echo "🎉 Installation terminée avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Configurez vos clés API dans le fichier .env :"
echo "   - OPENAI_API_KEY (requis pour l'IA)"
echo "   - TWILIO_SID et TWILIO_TOKEN (requis pour WhatsApp)"
echo "   - APIs réseaux sociaux (optionnel)"
echo ""
echo "2. Configurez le cron pour l'automatisation :"
echo "   * * * * * cd $(pwd) && php artisan schedule:run >> /dev/null 2>&1"
echo ""
echo "3. Démarrez l'application :"
echo "   php artisan serve"
echo ""
echo "4. Accédez à l'assistant marketing :"
echo "   http://localhost:8000/assistant-marketing"
echo ""
echo "📚 Documentation complète : ASSISTANT_MARKETING.md"
echo ""
echo "🚀 Votre assistant marketing digital est prêt à transformer votre business !"