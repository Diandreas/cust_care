# Configuration de Twilio pour l'envoi de SMS

Ce document explique comment configurer Twilio afin de permettre l'envoi de SMS via l'application EliteSMS.

## Prérequis

- Un compte Twilio (vous pouvez en créer un sur [www.twilio.com](https://www.twilio.com))
- Un numéro de téléphone Twilio avec capacité SMS
- Les identifiants d'API de votre compte Twilio

## Étapes de configuration

### 1. Créer un compte Twilio

1. Rendez-vous sur [www.twilio.com](https://www.twilio.com) et inscrivez-vous pour un compte
2. Vérifiez votre adresse e-mail et votre numéro de téléphone
3. Complétez la configuration initiale de votre compte

### 2. Obtenir un numéro de téléphone

1. Dans le tableau de bord Twilio, accédez à "Phone Numbers" > "Manage" > "Buy a number"
2. Recherchez un numéro disponible avec les capacités SMS pour votre région
3. Achetez le numéro (gratuit avec un compte d'essai, ou payant pour un compte de production)

### 3. Récupérer vos identifiants d'API

1. Dans le tableau de bord Twilio, accédez à la page d'accueil du projet
2. Notez votre "Account SID" et "Auth Token" (visible en cliquant sur "Show")

### 4. Configurer l'application

1. Ouvrez le fichier `.env` à la racine de votre application
2. Mettez à jour les variables suivantes avec vos identifiants:

```
TWILIO_SID=votre_account_sid
TWILIO_AUTH_TOKEN=votre_auth_token
TWILIO_NUMBER=votre_numero_de_telephone (au format E.164, ex: +33612345678)
TWILIO_WHATSAPP_NUMBER=votre_numero_whatsapp (au format E.164, si vous utilisez WhatsApp)
```

### 5. Tester la configuration

1. Redémarrez l'application si nécessaire
2. Créez une nouvelle campagne avec un seul destinataire (vous-même) pour tester l'envoi
3. Vérifiez que vous recevez le SMS sur votre téléphone

## Configuration des webhooks (facultatif mais recommandé)

Pour suivre le statut de livraison des SMS :

1. Dans le tableau de bord Twilio, accédez à "Phone Numbers" > "Manage" > "Active numbers"
2. Cliquez sur votre numéro de téléphone
3. Faites défiler jusqu'à "Messaging"
4. Dans "A message comes in", configurez le webhook pour pointer vers :
   `https://votre-domaine.com/api/webhooks/twilio`
5. Assurez-vous que la méthode HTTP est définie sur "HTTP POST"

## Passage en production

Lorsque vous êtes prêt à passer en production :

1. Mettez à niveau votre compte Twilio vers un compte payant
2. Achetez un numéro de téléphone permanent pour la production
3. Mettez à jour les identifiants dans votre environnement de production
4. Effectuez des tests d'envoi de masse à petit volume avant de lancer des campagnes importantes

## Dépannage

Si les SMS ne sont pas envoyés correctement :

1. Vérifiez les journaux de l'application pour les erreurs
2. Assurez-vous que les identifiants Twilio sont correctement configurés
3. Vérifiez que votre compte Twilio dispose de crédits suffisants
4. Confirmez que le numéro de destination est au format international E.164 (par exemple, +33612345678)
5. Vérifiez le tableau de bord Twilio pour voir si des erreurs sont signalées

## Ressources supplémentaires

- [Documentation Twilio pour PHP](https://www.twilio.com/docs/libraries/php)
- [Guide de dépannage Twilio](https://www.twilio.com/docs/api/errors)
- [Formats de numéros internationaux](https://www.twilio.com/docs/glossary/what-e164) 