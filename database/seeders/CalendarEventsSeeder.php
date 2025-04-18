<?php

namespace Database\Seeders;

use App\Models\CalendarEvent;
use Illuminate\Database\Seeder;

class CalendarEventsSeeder extends Seeder
{
    public function run(): void
    {
        // Les evenements du calendrier bases sur les documents fournis
        $events = [
            // JANVIER
            ['name' => 'Nouvel An', 'code' => 'new_year', 'category' => 'calendar', 'month' => '01', 'day' => '01', 'description' => 'Voeux, resolutions et offres de debut d\'annee'],
            ['name' => 'Epiphanie / Fete des Rois', 'code' => 'epiphany', 'category' => 'calendar', 'month' => '01', 'day' => '06', 'description' => 'Mise en avant d\'offres speciales autour de la galette des rois ou d\'un tirage au sort'],
            
            // FEVRIER
            ['name' => 'Saint-Valentin', 'code' => 'valentines_day', 'category' => 'marketing', 'month' => '02', 'day' => '14', 'description' => 'Campagne pour couples ou offres en solo avec une approche romantique'],
            ['name' => 'Carnaval', 'code' => 'carnival', 'category' => 'marketing', 'month' => '02', 'day' => '20', 'description' => 'Animation festive, promotions deguisees ou concours interactifs'],
            ['name' => 'Course de l\'Espoir au Mont Cameroun', 'code' => 'hope_race', 'category' => 'marketing', 'month' => '02', 'day' => '25', 'description' => 'Ciblage des amateurs de sport et de bien-etre, sponsoring ou soutien local'],
            
            // MARS
            ['name' => 'Journee Internationale de la Femme', 'code' => 'womens_day', 'category' => 'calendar', 'month' => '03', 'day' => '08', 'description' => 'Celebrer la femme, mettre en avant des offres dediees et valoriser l\'empowerment'],
            ['name' => 'Fete des Grands-Meres', 'code' => 'grandmothers_day', 'category' => 'marketing', 'month' => '03', 'day' => '02', 'description' => 'Remercier et honorer les grands-meres avec des promotions adaptees'],
            
            // AVRIL
            ['name' => 'Paques', 'code' => 'easter', 'category' => 'calendar', 'month' => '04', 'day' => '20', 'description' => 'Promouvoir des offres speciales, concours, chasse aux oeufs digitale ou offres familiales'],
            ['name' => 'Lundi de Paques', 'code' => 'easter_monday', 'category' => 'calendar', 'month' => '04', 'day' => '21', 'description' => 'Continuation des celebrations pascales'],
            ['name' => 'Journee de la Terre', 'code' => 'earth_day', 'category' => 'calendar', 'month' => '04', 'day' => '22', 'description' => 'Sensibilisation environnementale, communication responsable, et offres vertes'],
            
            // MAI
            ['name' => 'Fete du Travail', 'code' => 'labor_day', 'category' => 'calendar', 'month' => '05', 'day' => '01', 'description' => 'Remercier les salaries et travailleurs, offres speciales sur des services ou produits lies au bien-etre au travail'],
            ['name' => 'Fete des Meres', 'code' => 'mothers_day', 'category' => 'marketing', 'month' => '05', 'day' => '25', 'description' => 'Campagnes affectives dediees aux meres, offres cadeaux et messages personnalises'],
            ['name' => 'Fete de la Jeunesse', 'code' => 'youth_day', 'category' => 'marketing', 'month' => '05', 'day' => '15', 'description' => 'Valoriser les jeunes avec des offres adaptees, concours et animations interactives'],
            
            // JUIN
            ['name' => 'Journee Mondiale de l\'Environnement', 'code' => 'environment_day', 'category' => 'calendar', 'month' => '06', 'day' => '05', 'description' => 'Sensibiliser sur les enjeux environnementaux, promouvoir des produits ecologiques'],
            ['name' => 'Fete des Peres', 'code' => 'fathers_day', 'category' => 'marketing', 'month' => '06', 'day' => '15', 'description' => 'Mettre en avant des offres cadeaux, promotions sur des produits pour hommes ou experiences familiales'],
            ['name' => 'Journee de la Musique', 'code' => 'music_day', 'category' => 'calendar', 'month' => '06', 'day' => '21', 'description' => 'Promotions sur produits lies a la musique, partenariats avec des artistes locaux ou contenus exclusifs'],
            
            // JUILLET
            ['name' => 'Fete Nationale', 'code' => 'national_day', 'category' => 'calendar', 'month' => '07', 'day' => '14', 'description' => 'Campagnes festives, patriotisme et offres exclusives en lien avec la celebration nationale'],
            ['name' => 'Festival Medumba', 'code' => 'medumba_festival', 'category' => 'marketing', 'month' => '07', 'day' => '15', 'description' => 'Mise en avant de la culture et traditions locales, soutien aux evenements culturels'],
            
            // AOUT
            ['name' => 'Assomption', 'code' => 'assumption', 'category' => 'calendar', 'month' => '08', 'day' => '15', 'description' => 'Fete religieuse chretienne'],
            ['name' => 'Rentree Scolaire', 'code' => 'back_to_school', 'category' => 'marketing', 'month' => '08', 'day' => '25', 'description' => 'Promotions sur fournitures, vetements et services lies a l\'education'],
            ['name' => 'Fetes Locales d\'ete', 'code' => 'summer_local_festivals', 'category' => 'marketing', 'month' => '08', 'day' => '10', 'description' => 'Campagnes regionales mettant en avant des festivals ou manifestations locales'],
            
            // SEPTEMBRE
            ['name' => 'Journee de l\'Independance', 'code' => 'independence_day', 'category' => 'calendar', 'month' => '09', 'day' => '20', 'description' => 'Messages de fierte nationale, offres sur des produits ou services locaux'],
            ['name' => 'Journee du Patrimoine Culturel', 'code' => 'cultural_heritage_day', 'category' => 'marketing', 'month' => '09', 'day' => '15', 'description' => 'Valoriser la richesse culturelle locale et historique, partenariats avec des institutions culturelles'],
            
            // OCTOBRE
            ['name' => 'Halloween', 'code' => 'halloween', 'category' => 'marketing', 'month' => '10', 'day' => '31', 'description' => 'Campagne ludique et creative, promotions sur des produits thematiques (deguisements, decorations)'],
            ['name' => 'Festivals Locaux d\'Octobre', 'code' => 'october_local_festivals', 'category' => 'marketing', 'month' => '10', 'day' => '15', 'description' => 'Exploiter les manifestations culturelles ou carnavals organises en octobre'],
            
            // NOVEMBRE
            ['name' => 'Toussaint', 'code' => 'all_saints', 'category' => 'calendar', 'month' => '11', 'day' => '01', 'description' => 'Respect et commemoration, messages sensibles ou campagnes sur la memoire et la tradition'],
            ['name' => 'Jour des Morts', 'code' => 'all_souls', 'category' => 'calendar', 'month' => '11', 'day' => '02', 'description' => 'Commemoration et recueillement'],
            ['name' => 'Journee Internationale de la Gentillesse', 'code' => 'kindness_day', 'category' => 'marketing', 'month' => '11', 'day' => '13', 'description' => 'Promouvoir des valeurs positives et creer un lien affectif avec la clientele'],
            ['name' => 'Black Friday', 'code' => 'black_friday', 'category' => 'marketing', 'month' => '11', 'day' => '28', 'description' => 'Promotions flash, offres exceptionnelles pour stimuler les ventes en ligne'],
            ['name' => 'Cyber Monday', 'code' => 'cyber_monday', 'category' => 'marketing', 'month' => '12', 'day' => '01', 'description' => 'Prolongation des offres de Black Friday pour le commerce en ligne'],
            
            // DECEMBRE
            ['name' => 'Noel', 'code' => 'christmas', 'category' => 'calendar', 'month' => '12', 'day' => '25', 'description' => 'Campagnes festives, offres cadeaux, voeux personnalises et animations exclusives'],
            ['name' => 'Reveillon du Nouvel An', 'code' => 'new_years_eve', 'category' => 'marketing', 'month' => '12', 'day' => '31', 'description' => 'Derniere ligne droite avant la nouvelle annee, retrospective et anticipation des nouveautes a venir'],
            ['name' => 'Fete du Achum a Bafut', 'code' => 'achum_festival', 'category' => 'marketing', 'month' => '12', 'day' => '10', 'description' => 'Celebration traditionnelle mettant en avant les rites sacres et les victoires historiques'],
            ['name' => 'Festival Msem Todjom a Bandjoun', 'code' => 'msem_todjom_festival', 'category' => 'marketing', 'month' => '12', 'day' => '15', 'description' => 'Festival valorisant le patrimoine local']
        ];
        
        // Creer les evenements du calendrier dans la base de donnees
        foreach ($events as $event) {
            CalendarEvent::firstOrCreate(
                ['code' => $event['code']], 
                [
                    'name' => $event['name'],
                    'description' => $event['description'],
                    'category' => $event['category'],
                    'is_global' => true,
                    'month' => $event['month'],
                    'day' => $event['day'],
                    'is_active' => true,
                    'metadata' => ['year' => '2025'] 
                ]
            );
        }
        

        $nameDayEvents = [
            ['name' => 'Fete des Marie', 'code' => 'name_day_marie', 'category' => 'personal', 'month' => '01', 'day' => '01'],
            ['name' => 'Fete des Basile', 'code' => 'name_day_basile', 'category' => 'personal', 'month' => '01', 'day' => '02'],
            ['name' => 'Fete des Genevieve', 'code' => 'name_day_genevieve', 'category' => 'personal', 'month' => '01', 'day' => '03'],
           
        ];
        
        foreach ($nameDayEvents as $event) {
            CalendarEvent::firstOrCreate(
                ['code' => $event['code']],
                [
                    'name' => $event['name'],
                    'description' => 'Souhaiter une bonne fete aux clients portant ce prenom',
                    'category' => $event['category'],
                    'is_global' => false, 
                    'month' => $event['month'],
                    'day' => $event['day'],
                    'is_active' => true,
                    'metadata' => ['type' => 'name_day', 'name' => str_replace('Fete des ', '', $event['name'])]
                ]
            );
        }
    }
}