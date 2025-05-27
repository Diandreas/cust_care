import { useTranslation as useReactI18nTranslation } from 'react-i18next';
import i18n from './Config/i18n';

// Cette fonction est un wrapper autour de useTranslation de react-i18next
// avec des propriétés supplémentaires pour le sélecteur de langue
export const useTranslation = () => {
    const translation = useReactI18nTranslation();

    return {
        ...translation,
        locale: i18n.language,
        changeLocale: (lang: string) => i18n.changeLanguage(lang),
        locales: ['fr', 'en'] // Les langues supportées par l'application
    };
};

// Exporter d'autres fonctions d'i18n si nécessaire
export * from 'react-i18next'; 