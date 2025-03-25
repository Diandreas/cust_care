import Swal from 'sweetalert2';

/**
 * Afficher une alerte de confirmation avec SweetAlert2
 * 
 * @param {string} title Le titre de l'alerte
 * @param {string} text Le texte de l'alerte
 * @param {string} confirmButtonText Le texte du bouton de confirmation
 * @param {string} cancelButtonText Le texte du bouton d'annulation
 * @param {string} icon L'icône à afficher (success, error, warning, info, question)
 * @returns {Promise} Une promesse qui sera résolue si l'utilisateur confirme
 */
export const confirmDialog = (title, text, confirmButtonText = 'Confirmer', cancelButtonText = 'Annuler', icon = 'warning') => {
    return Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#d33',
        confirmButtonText,
        cancelButtonText,
        reverseButtons: true
    });
};

/**
 * Afficher une alerte de succès avec SweetAlert2
 * 
 * @param {string} title Le titre de l'alerte
 * @param {string} text Le texte de l'alerte
 * @returns {Promise} Une promesse qui sera résolue après que l'utilisateur a fermé l'alerte
 */
export const successAlert = (title, text = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'success',
        confirmButtonColor: '#6366f1'
    });
};

/**
 * Afficher une alerte d'erreur avec SweetAlert2
 * 
 * @param {string} title Le titre de l'alerte
 * @param {string} text Le texte de l'alerte
 * @returns {Promise} Une promesse qui sera résolue après que l'utilisateur a fermé l'alerte
 */
export const errorAlert = (title, text = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'error',
        confirmButtonColor: '#6366f1'
    });
};

/**
 * Afficher une alerte d'information avec SweetAlert2
 * 
 * @param {string} title Le titre de l'alerte
 * @param {string} text Le texte de l'alerte
 * @returns {Promise} Une promesse qui sera résolue après que l'utilisateur a fermé l'alerte
 */
export const infoAlert = (title, text = '') => {
    return Swal.fire({
        title,
        text,
        icon: 'info',
        confirmButtonColor: '#6366f1'
    });
};

/**
 * Afficher une alerte de chargement avec SweetAlert2
 * 
 * @param {string} title Le titre de l'alerte
 * @returns {Function} Une fonction pour fermer l'alerte
 */
export const loadingAlert = (title = 'Chargement...') => {
    Swal.fire({
        title,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    return () => Swal.close();
};

export default {
    confirmDialog,
    successAlert,
    errorAlert,
    infoAlert,
    loadingAlert
}; 