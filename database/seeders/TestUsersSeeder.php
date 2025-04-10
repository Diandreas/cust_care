<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Client;
use App\Models\Tag;
use App\Models\Campaign;
use App\Models\Template;
use App\Models\Message;
use App\Models\Visit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TestUsersSeeder extends Seeder
{
    /**
     * Seed the application's database with test users and their data.
     */
    public function run(): void
    {
        // Gérer différemment les clés étrangères selon le driver
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }
        
        // Créer un utilisateur de démonstration
        $demoUser = User::factory()->create([
            'name' => 'Utilisateur Démo',
            'email' => 'demo@example.com',
            'password' => Hash::make('password'),
        ]);
        
        // Créer un utilisateur admin
        $adminUser = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        // Création de tags pour l'utilisateur de démo
        $tags = [
            'VIP', 'Fidèle', 'Nouveau client', 'Inactif', 'Étudiant',
            'Professionnel', 'Retraité', 'Zone Nord', 'Zone Sud', 'Préférence Matin'
        ];
        
        $tagIds = [];
        foreach ($tags as $tagName) {
            $tag = Tag::factory()->create([
                'user_id' => $demoUser->id,
                'name' => $tagName,
            ]);
            $tagIds[] = $tag->id;
        }
        
        // Création de clients pour l'utilisateur de démo
        $clients = Client::factory(50)->create([
            'user_id' => $demoUser->id,
        ]);
        
        // Associer des tags aux clients
        foreach ($clients as $client) {
            // Attribuer entre 0 et 3 tags aléatoirement
            $numTags = fake()->numberBetween(0, 3);
            $randomTags = fake()->randomElements($tagIds, $numTags);
            
            $client->tags()->attach($randomTags);
        }
        
        // Création de templates pour l'utilisateur de démo
        Template::factory(10)->create([
            'user_id' => $demoUser->id,
        ]);
        
        // Création de campagnes avec différents statuts pour l'utilisateur de démo
        
        // Campagnes envoyées (passées)
        $sentCampaigns = Campaign::factory(5)->sent()->create([
            'user_id' => $demoUser->id,
        ]);
        
        foreach ($sentCampaigns as $campaign) {
            // Sélectionner aléatoirement entre 5 et 20 clients
            $selectedClients = $clients->random(fake()->numberBetween(5, 20));
            $campaign->recipients()->attach($selectedClients);
            
            // Mettre à jour le nombre de destinataires
            $campaign->recipients_count = $selectedClients->count();
            $campaign->save();
            
            // Créer des messages pour chaque client de la campagne
            foreach ($selectedClients as $client) {
                $isDelivered = fake()->boolean(90); // 90% de chance d'être livré
                $sentAt = $campaign->scheduled_at;
                $deliveredAt = $isDelivered ? fake()->dateTimeBetween($sentAt, '+10 minutes') : null;
                
                Message::factory()->create([
                    'user_id' => $demoUser->id,
                    'client_id' => $client->id,
                    'campaign_id' => $campaign->id,
                    'content' => $campaign->message_content,
                    'status' => $isDelivered ? 'delivered' : 'failed',
                    'type' => 'promotional',
                    'sent_at' => $sentAt,
                    'delivered_at' => $deliveredAt,
                    'created_at' => $campaign->scheduled_at,
                ]);
            }
        }
        
        // Campagnes programmées (futures)
        $scheduledCampaigns = Campaign::factory(3)->scheduled()->create([
            'user_id' => $demoUser->id,
        ]);
        
        foreach ($scheduledCampaigns as $campaign) {
            // Sélectionner aléatoirement entre 5 et 20 clients
            $selectedClients = $clients->random(fake()->numberBetween(5, 20));
            $campaign->recipients()->attach($selectedClients);
            
            // Mettre à jour le nombre de destinataires
            $campaign->recipients_count = $selectedClients->count();
            $campaign->save();
        }
        
        // Campagnes en brouillon
        $draftCampaigns = Campaign::factory(2)->draft()->create([
            'user_id' => $demoUser->id,
        ]);
        
        foreach ($draftCampaigns as $campaign) {
            // Sélectionner aléatoirement entre 5 et 15 clients
            $selectedClients = $clients->random(fake()->numberBetween(5, 15));
            $campaign->recipients()->attach($selectedClients);
            
            // Mettre à jour le nombre de destinataires
            $campaign->recipients_count = $selectedClients->count();
            $campaign->save();
        }
        
        // Création de messages individuels (hors campagne)
        foreach ($clients->random(15) as $client) {
            $numberOfMessages = fake()->numberBetween(1, 5);
            for ($i = 0; $i < $numberOfMessages; $i++) {
                Message::factory()->create([
                    'user_id' => $demoUser->id,
                    'client_id' => $client->id,
                    'campaign_id' => null,
                ]);
            }
        }
        
        // Création de visites pour certains clients
        foreach ($clients->random(20) as $client) {
            $numberOfVisits = fake()->numberBetween(1, 3);
            Visit::factory($numberOfVisits)->create([
                'user_id' => $demoUser->id,
                'client_id' => $client->id,
            ]);
        }
        
        // Réactiver les clés étrangères
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
        
        // Afficher message de succès
        echo "Données de test créées avec succès!\n";
    }
} 