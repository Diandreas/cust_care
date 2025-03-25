import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// Fonction pour afficher un toast de succès
export const showSuccess = (message: string) => {
    toast.success(message, {
        duration: 3000,
    });
};

// Fonction pour afficher un toast d'erreur
export const showError = (message: string) => {
    toast.error(message, {
        duration: 5000,
    });
};

// Fonction pour afficher un toast d'information
export const showInfo = (message: string) => {
    toast.info(message, {
        duration: 3000,
    });
};

// Fonction pour afficher un toast d'avertissement
export const showWarning = (message: string) => {
    toast.warning(message, {
        duration: 4000,
    });
};

// Hook personnalisé pour utiliser les toasts avec i18n
export const useToast = () => {
    const { t } = useTranslation();

    return {
        success: (key: string, params?: Record<string, any>) => showSuccess(t(key, params)),
        error: (key: string, params?: Record<string, any>) => showError(t(key, params)),
        info: (key: string, params?: Record<string, any>) => showInfo(t(key, params)),
        warning: (key: string, params?: Record<string, any>) => showWarning(t(key, params)),
    };
}; 