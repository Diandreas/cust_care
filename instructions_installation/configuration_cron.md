# Configuration des tâches planifiées (CRON)

Pour assurer le bon fonctionnement des envois automatiques de SMS et des campagnes programmées, vous devez configurer correctement les tâches planifiées sur le serveur de production.

## Prérequis

- Accès au serveur via SSH ou au panneau de configuration pour configurer les tâches cron
- PHP 8.2 ou supérieur installé sur le serveur
- Permissions d'exécution pour l'utilisateur qui exécutera les tâches cron

## Configuration du CRON

### 1. Configuration pour les systèmes Linux/Unix

Ajoutez la ligne suivante à votre fichier crontab (accessible via la commande `crontab -e`) :

```
* * * * * cd /chemin/vers/votre/application && php artisan scheduler:run >> /dev/null 2>&1
```

Cette commande exécutera notre gestionnaire de tâches personnalisé toutes les minutes, qui à son tour :
- Vérifiera les campagnes programmées à envoyer
- Exécutera les traitements quotidiens des événements automatiques (anniversaires, fêtes, etc.)

### 2. Configuration pour les hébergements partagés

Si vous utilisez un hébergement partagé sans accès SSH, configurez une tâche cron dans votre panneau de contrôle d'hébergement (cPanel, Plesk, etc.) :

- **Commande à exécuter** : `php /chemin/vers/votre/application/artisan scheduler:run`
- **Fréquence** : Toutes les minutes

### 3. Configuration pour Windows Server

Pour Windows Server, utilisez le Planificateur de tâches :

1. Créez une nouvelle tâche planifiée
2. Définissez le déclencheur pour qu'il s'exécute toutes les minutes
3. Action : démarrer un programme
   - Programme/script : `php`
   - Arguments : `artisan scheduler:run`
   - Démarrer dans : `D:\chemin\vers\votre\application`

## Vérification

Pour vérifier que la configuration fonctionne correctement :

1. Consultez les journaux d'application (storage/logs/laravel.log)
2. Créez une campagne programmée pour un futur proche et vérifiez qu'elle est envoyée
3. Vérifiez le fonctionnement des messages automatiques d'anniversaire

## Maintenance

Pour maintenir un fonctionnement optimal :

- Vérifiez régulièrement les journaux pour détecter les erreurs éventuelles
- Redémarrez le service cron après les mises à jour majeures de l'application
- Assurez-vous que le disque dur a suffisamment d'espace pour les fichiers de journalisation

## Résolution des problèmes

Si les tâches planifiées ne s'exécutent pas :

1. Vérifiez que le service cron est en cours d'exécution sur le serveur
2. Assurez-vous que les permissions de fichier sont correctes
3. Vérifiez les chemins d'accès dans la commande cron
4. Consultez les journaux d'erreur du système 