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

// Récupérer la session Laravel pour chaque requête (évite l'erreur 419)
window.axios.interceptors.request.use(config => {
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
            return axios.get('/sanctum/csrf-cookie').then(() => {
                // Obtenir le nouveau token
                const token = document.head.querySelector('meta[name="csrf-token"]');
                if (token) {
                    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;

                    // Recréer la requête originale avec le nouveau token
                    const originalRequest = error.config;
                    return axios(originalRequest);
                }
                return Promise.reject(error);
            });
        }

        // Si ce n'est pas une erreur 419, rejeter normalement
        return Promise.reject(error);
    }
);

window._ = _; 