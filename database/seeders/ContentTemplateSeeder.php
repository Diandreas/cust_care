<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ContentTemplate;

class ContentTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            // Templates pour posts réseaux sociaux
            [
                'name' => 'Promotion Flash',
                'description' => 'Template pour les promotions limitées dans le temps',
                'type' => 'post',
                'category' => 'promotional',
                'content_structure' => '🔥 PROMOTION FLASH ! {pourcentage}% de réduction sur {produit} ! Valable jusqu\'au {date_fin}. Ne ratez pas cette occasion unique ! {hashtags}',
                'variables' => ['pourcentage', 'produit', 'date_fin', 'hashtags'],
                'default_values' => [
                    'pourcentage' => '20',
                    'hashtags' => '#promo #soldes #limitedtime'
                ],
                'is_public' => true
            ],
            [
                'name' => 'Contenu Éducatif',
                'description' => 'Template pour partager des conseils et astuces',
                'type' => 'post',
                'category' => 'educational',
                'content_structure' => '💡 Astuce du jour : {conseil} 

Avez-vous déjà essayé ? Partagez votre expérience en commentaire ! 

{hashtags}',
                'variables' => ['conseil', 'hashtags'],
                'default_values' => [
                    'hashtags' => '#astuce #conseil #tips'
                ],
                'is_public' => true
            ],
            [
                'name' => 'Témoignage Client',
                'description' => 'Template pour mettre en avant les avis clients',
                'type' => 'post',
                'category' => 'promotional',
                'content_structure' => '⭐ Témoignage client : 

"{temoignage}" - {nom_client}

Merci {nom_client} pour votre confiance ! Votre satisfaction est notre priorité. 

{hashtags}',
                'variables' => ['temoignage', 'nom_client', 'hashtags'],
                'default_values' => [
                    'hashtags' => '#temoignage #satisfaction #client'
                ],
                'is_public' => true
            ],

            // Templates pour messages WhatsApp
            [
                'name' => 'Message d\'Anniversaire',
                'description' => 'Message automatique pour les anniversaires',
                'type' => 'whatsapp',
                'category' => 'seasonal',
                'content_structure' => '🎉 Joyeux anniversaire {nom} ! 

Toute l\'équipe vous souhaite une journée exceptionnelle remplie de bonheur et de sourires ! 

🎁 Pour célébrer, profitez de 15% de réduction avec le code ANNIV15',
                'variables' => ['nom'],
                'default_values' => [],
                'is_public' => true
            ],
            [
                'name' => 'Message de Bienvenue',
                'description' => 'Message pour accueillir les nouveaux clients',
                'type' => 'whatsapp',
                'category' => 'announcement',
                'content_structure' => '👋 Bienvenue {nom} ! 

Merci de nous avoir rejoint. Nous sommes ravis de vous compter parmi nos clients !

🎁 En cadeau de bienvenue, voici 10% de réduction sur votre prochain achat : BIENVENUE10

N\'hésitez pas à nous contacter si vous avez des questions !',
                'variables' => ['nom'],
                'default_values' => [],
                'is_public' => true
            ],
            [
                'name' => 'Rappel de Rendez-vous',
                'description' => 'Rappel automatique de rendez-vous',
                'type' => 'whatsapp',
                'category' => 'announcement',
                'content_structure' => '📅 Rappel : Vous avez rendez-vous {date} à {heure}.

Adresse : {adresse}

Merci de confirmer votre présence en répondant à ce message.

À bientôt !',
                'variables' => ['date', 'heure', 'adresse'],
                'default_values' => [],
                'is_public' => true
            ],

            // Templates pour emails
            [
                'name' => 'Newsletter Mensuelle',
                'description' => 'Template pour newsletter régulière',
                'type' => 'email',
                'category' => 'announcement',
                'content_structure' => 'Bonjour {nom},

Voici les actualités de ce mois :

{contenu_principal}

🔗 Liens utiles :
{liens}

À bientôt !
L\'équipe {entreprise}',
                'variables' => ['nom', 'contenu_principal', 'liens', 'entreprise'],
                'default_values' => [
                    'entreprise' => 'Notre Entreprise'
                ],
                'is_public' => true
            ],

            // Templates saisonniers
            [
                'name' => 'Vœux de Noël',
                'description' => 'Message pour les fêtes de fin d\'année',
                'type' => 'whatsapp',
                'category' => 'seasonal',
                'content_structure' => '🎄 Joyeux Noël {nom} !

Que cette période de fêtes vous apporte joie, bonheur et moments précieux en famille.

Merci pour votre fidélité tout au long de cette année.

🎁 Passez d\'excellentes fêtes !',
                'variables' => ['nom'],
                'default_values' => [],
                'is_public' => true
            ],
            [
                'name' => 'Bonne Année',
                'description' => 'Message de vœux pour la nouvelle année',
                'type' => 'whatsapp',
                'category' => 'seasonal',
                'content_structure' => '🎊 Bonne année {nom} !

Que cette nouvelle année vous apporte santé, bonheur et réussite dans tous vos projets !

Merci pour votre confiance et à très bientôt pour de nouvelles aventures ensemble !

✨ {annee} sera une année exceptionnelle !',
                'variables' => ['nom', 'annee'],
                'default_values' => [
                    'annee' => date('Y')
                ],
                'is_public' => true
            ],

            // Templates pour articles
            [
                'name' => 'Article Guide',
                'description' => 'Structure pour article de guide pratique',
                'type' => 'article',
                'category' => 'educational',
                'content_structure' => '# {titre}

## Introduction
{introduction}

## Les étapes essentielles

### 1. {etape1_titre}
{etape1_contenu}

### 2. {etape2_titre}
{etape2_contenu}

### 3. {etape3_titre}
{etape3_contenu}

## Conseils pratiques
{conseils}

## Conclusion
{conclusion}',
                'variables' => ['titre', 'introduction', 'etape1_titre', 'etape1_contenu', 'etape2_titre', 'etape2_contenu', 'etape3_titre', 'etape3_contenu', 'conseils', 'conclusion'],
                'default_values' => [],
                'is_public' => true
            ]
        ];

        foreach ($templates as $template) {
            ContentTemplate::create([
                'user_id' => 1, // Utilisateur admin par défaut
                'name' => $template['name'],
                'description' => $template['description'],
                'type' => $template['type'],
                'category' => $template['category'],
                'content_structure' => $template['content_structure'],
                'variables' => $template['variables'],
                'default_values' => $template['default_values'],
                'is_public' => $template['is_public']
            ]);
        }
    }
}