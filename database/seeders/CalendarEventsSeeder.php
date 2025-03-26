<?php

namespace Database\Seeders;

use App\Models\CalendarEvent;
use Illuminate\Database\Seeder;

class CalendarEventsSeeder extends Seeder
{
    public function run(): void
    {
        // Les événements du calendrier basés sur les documents fournis
        $events = [
            // JANVIER
            ['name' => 'Nouvel An', 'code' => 'new_year', 'category' => 'calendar', 'month' => '01', 'day' => '01', 'description' => 'Vœux, résolutions et offres de début d\'année'],
            ['name' => 'Épiphanie / Fête des Rois', 'code' => 'epiphany', 'category' => 'calendar', 'month' => '01', 'day' => '06', 'description' => 'Mise en avant d\'offres spéciales autour de la galette des rois ou d\'un tirage au sort'],
            
            // FÉVRIER
            ['name' => 'Saint-Valentin', 'code' => 'valentines_day', 'category' => 'marketing', 'month' => '02', 'day' => '14', 'description' => 'Campagne pour couples ou offres en solo avec une approche romantique'],
            ['name' => 'Carnaval', 'code' => 'carnival', 'category' => 'marketing', 'month' => '02', 'day' => '20', 'description' => 'Animation festive, promotions « déguisées » ou concours interactifs'],
            ['name' => 'Course de l\'Espoir au Mont Cameroun', 'code' => 'hope_race', 'category' => 'marketing', 'month' => '02', 'day' => '25', 'description' => 'Ciblage des amateurs de sport et de bien-être, sponsoring ou soutien local'],
            
            // MARS
            ['name' => 'Journée Internationale de la Femme', 'code' => 'womens_day', 'category' => 'calendar', 'month' => '03', 'day' => '08', 'description' => 'Célébrer la femme, mettre en avant des offres dédiées et valoriser l\'empowerment'],
            ['name' => 'Fête des Grands-Mères', 'code' => 'grandmothers_day', 'category' => 'marketing', 'month' => '03', 'day' => '02', 'description' => 'Remercier et honorer les grands-mères avec des promotions adaptées'],
            
            // AVRIL
            ['name' => 'Pâques', 'code' => 'easter', 'category' => 'calendar', 'month' => '04', 'day' => '20', 'description' => 'Promouvoir des offres spéciales, concours, chasse aux œufs digitale ou offres familiales'],
            ['name' => 'Lundi de Pâques', 'code' => 'easter_monday', 'category' => 'calendar', 'month' => '04', 'day' => '21', 'description' => 'Continuation des célébrations pascales'],
            ['name' => 'Journée de la Terre', 'code' => 'earth_day', 'category' => 'calendar', 'month' => '04', 'day' => '22', 'description' => 'Sensibilisation environnementale, communication responsable, et offres vertes'],
            
            // MAI
            ['name' => 'Fête du Travail', 'code' => 'labor_day', 'category' => 'calendar', 'month' => '05', 'day' => '01', 'description' => 'Remercier les salariés et travailleurs, offres spéciales sur des services ou produits liés au bien-être au travail'],
            ['name' => 'Fête des Mères', 'code' => 'mothers_day', 'category' => 'marketing', 'month' => '05', 'day' => '25', 'description' => 'Campagnes affectives dédiées aux mères, offres cadeaux et messages personnalisés'],
            ['name' => 'Fête de la Jeunesse', 'code' => 'youth_day', 'category' => 'marketing', 'month' => '05', 'day' => '15', 'description' => 'Valoriser les jeunes avec des offres adaptées, concours et animations interactives'],
            
            // JUIN
            ['name' => 'Journée Mondiale de l\'Environnement', 'code' => 'environment_day', 'category' => 'calendar', 'month' => '06', 'day' => '05', 'description' => 'Sensibiliser sur les enjeux environnementaux, promouvoir des produits écologiques'],
            ['name' => 'Fête des Pères', 'code' => 'fathers_day', 'category' => 'marketing', 'month' => '06', 'day' => '15', 'description' => 'Mettre en avant des offres cadeaux, promotions sur des produits pour hommes ou expériences familiales'],
            ['name' => 'Journée de la Musique', 'code' => 'music_day', 'category' => 'calendar', 'month' => '06', 'day' => '21', 'description' => 'Promotions sur produits liés à la musique, partenariats avec des artistes locaux ou contenus exclusifs'],
            
            // JUILLET
            ['name' => 'Fête Nationale', 'code' => 'national_day', 'category' => 'calendar', 'month' => '07', 'day' => '14', 'description' => 'Campagnes festives, patriotisme et offres exclusives en lien avec la célébration nationale'],
            ['name' => 'Festival Medumba', 'code' => 'medumba_festival', 'category' => 'marketing', 'month' => '07', 'day' => '15', 'description' => 'Mise en avant de la culture et traditions locales, soutien aux événements culturels'],
            
            // AOÛT
            ['name' => 'Assomption', 'code' => 'assumption', 'category' => 'calendar', 'month' => '08', 'day' => '15', 'description' => 'Fête religieuse chrétienne'],
            ['name' => 'Rentrée Scolaire', 'code' => 'back_to_school', 'category' => 'marketing', 'month' => '08', 'day' => '25', 'description' => 'Promotions sur fournitures, vêtements et services liés à l\'éducation'],
            ['name' => 'Fêtes Locales d\'Été', 'code' => 'summer_local_festivals', 'category' => 'marketing', 'month' => '08', 'day' => '10', 'description' => 'Campagnes régionales mettant en avant des festivals ou manifestations locales'],
            
            // SEPTEMBRE
            ['name' => 'Journée de l\'Indépendance', 'code' => 'independence_day', 'category' => 'calendar', 'month' => '09', 'day' => '20', 'description' => 'Messages de fierté nationale, offres sur des produits ou services locaux'],
            ['name' => 'Journée du Patrimoine Culturel', 'code' => 'cultural_heritage_day', 'category' => 'marketing', 'month' => '09', 'day' => '15', 'description' => 'Valoriser la richesse culturelle locale et historique, partenariats avec des institutions culturelles'],
            
            // OCTOBRE
            ['name' => 'Halloween', 'code' => 'halloween', 'category' => 'marketing', 'month' => '10', 'day' => '31', 'description' => 'Campagne ludique et créative, promotions sur des produits thématiques (déguisements, décorations)'],
            ['name' => 'Festivals Locaux d\'Octobre', 'code' => 'october_local_festivals', 'category' => 'marketing', 'month' => '10', 'day' => '15', 'description' => 'Exploiter les manifestations culturelles ou carnavals organisés en octobre'],
            
            // NOVEMBRE
            ['name' => 'Toussaint', 'code' => 'all_saints', 'category' => 'calendar', 'month' => '11', 'day' => '01', 'description' => 'Respect et commémoration, messages sensibles ou campagnes sur la mémoire et la tradition'],
            ['name' => 'Jour des Morts', 'code' => 'all_souls', 'category' => 'calendar', 'month' => '11', 'day' => '02', 'description' => 'Commémoration et recueillement'],
            ['name' => 'Journée Internationale de la Gentillesse', 'code' => 'kindness_day', 'category' => 'marketing', 'month' => '11', 'day' => '13', 'description' => 'Promouvoir des valeurs positives et créer un lien affectif avec la clientèle'],
            ['name' => 'Black Friday', 'code' => 'black_friday', 'category' => 'marketing', 'month' => '11', 'day' => '28', 'description' => 'Promotions flash, offres exceptionnelles pour stimuler les ventes en ligne'],
            ['name' => 'Cyber Monday', 'code' => 'cyber_monday', 'category' => 'marketing', 'month' => '12', 'day' => '01', 'description' => 'Prolongation des offres de Black Friday pour le commerce en ligne'],
            
            // DÉCEMBRE
            ['name' => 'Noël', 'code' => 'christmas', 'category' => 'calendar', 'month' => '12', 'day' => '25', 'description' => 'Campagnes festives, offres cadeaux, vœux personnalisés et animations exclusives'],
            ['name' => 'Réveillon du Nouvel An', 'code' => 'new_years_eve', 'category' => 'marketing', 'month' => '12', 'day' => '31', 'description' => 'Dernière ligne droite avant la nouvelle année, rétrospective et anticipation des nouveautés à venir'],
            ['name' => 'Fête du Achum à Bafut', 'code' => 'achum_festival', 'category' => 'marketing', 'month' => '12', 'day' => '10', 'description' => 'Célébration traditionnelle mettant en avant les rites sacrés et les victoires historiques'],
            ['name' => 'Festival Msem Todjom à Bandjoun', 'code' => 'msem_todjom_festival', 'category' => 'marketing', 'month' => '12', 'day' => '15', 'description' => 'Festival valorisant le patrimoine local']
        ];
        
        // Créer les événements du calendrier dans la base de données
        foreach ($events as $event) {
            CalendarEvent::firstOrCreate(
                ['code' => $event['code']], // Vérifier si l'événement existe déjà
                [
                    'name' => $event['name'],
                    'description' => $event['description'],
                    'category' => $event['category'],
                    'is_global' => true,
                    'month' => $event['month'],
                    'day' => $event['day'],
                    'is_active' => true,
                    'metadata' => ['year' => '2025'] // Ajouter l'année comme métadonnée
                ]
            );
        }
        
        // Ajouter également des événements pour les fêtes des prénoms (exemples)
        // Note: Votre calendrier complet contient des centaines de fêtes de prénoms, j'en inclus juste quelques-unes ici
        $nameDayEvents = [
            ['name' => 'Fête des Marie', 'code' => 'name_day_marie', 'category' => 'personal', 'month' => '01', 'day' => '01'],
            ['name' => 'Fête des Basile', 'code' => 'name_day_basile', 'category' => 'personal', 'month' => '01', 'day' => '02'],
            ['name' => 'Fête des Geneviève', 'code' => 'name_day_genevieve', 'category' => 'personal', 'month' => '01', 'day' => '03'],
            // Vous pouvez ajouter d'autres fêtes de prénoms selon vos besoins
        ];
        
        foreach ($nameDayEvents as $event) {
            CalendarEvent::firstOrCreate(
                ['code' => $event['code']],
                [
                    'name' => $event['name'],
                    'description' => 'Souhaiter une bonne fête aux clients portant ce prénom',
                    'category' => $event['category'],
                    'is_global' => false, // Les fêtes de prénoms sont personnelles, pas globales
                    'month' => $event['month'],
                    'day' => $event['day'],
                    'is_active' => true,
                    'metadata' => ['type' => 'name_day', 'name' => str_replace('Fête des ', '', $event['name'])]
                ]
            );
        }
    }
}