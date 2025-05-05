// Import des alertes SweetAlert2
import './Utils/sweetalert';

import axios from 'axios';
import _ from 'lodash';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Ajouter le jeton CSRF à toutes les requêtes
let token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Assurer que les cookies sont envoyés avec les requêtes cross-domain
window.axios.defaults.withCredentials = true;

// Récupérer la session Laravel pour chaque requête (évite l'erreur 419)
window.axios.interceptors.request.use(config => {
    // Toujours récupérer le token le plus récent avant chaque requête
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token.content;
    }
    
    config.withCredentials = true;
    return config;
});

// Ajouter un intercepteur pour les réponses pour gérer les erreurs 419 (CSRF token expiré)
window.axios.interceptors.response.use(
    response => response,
    error => {
        // Si nous recevons une erreur 419, le jeton CSRF a expiré, rafraîchir la page pour en obtenir un nouveau
        if (error.response && error.response.status === 419) {
            console.error('CSRF token mismatch! Refreshing token...');
            
            // Demander un nouveau token CSRF avant de réessayer
            return axios.get('/sanctum/csrf-cookie', { withCredentials: true })
                .then(() => {
                    // Obtenir le nouveau token après la demande de csrf-cookie
                    const token = document.head.querySelector('meta[name="csrf-token"]');
                    if (token) {
                        // Mettre à jour le token par défaut pour toutes les futures requêtes
                        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;

                        // Recréer la requête originale avec le nouveau token
                        const originalRequest = error.config;
                        originalRequest.headers['X-CSRF-TOKEN'] = token.content;
                        return axios(originalRequest);
                    }
                    return Promise.reject(error);
                })
                .catch(refreshError => {
                    console.error('Erreur lors du rafraîchissement du token CSRF:', refreshError);
                    
                    // Si le rafraîchissement échoue, recharger la page pour obtenir un nouveau token
                    if (confirm('Votre session a expiré. Voulez-vous recharger la page pour continuer?')) {
                        window.location.reload();
                    }
                    
                    return Promise.reject(error);
                });
        }

        // Si ce n'est pas une erreur 419, rejeter normalement
        return Promise.reject(error);
    }
);

window._ = _; 