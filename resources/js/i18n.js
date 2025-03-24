// resources/js/i18n.js
import i18n from 'i18next';
import { initReactI18next, useTranslation as useReactTranslation } from 'react-i18next';

import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enTranslation
            },
            fr: {
                translation: frTranslation
            }
        },
        lng: localStorage.getItem('language') || 'fr', // Défaut en français
        fallbackLng: 'fr',
        interpolation: {
            escapeValue: false
        }
    });

// Hook personnalisé pour l'utilisation dans LanguageSwitcher
export const useTranslation = () => {
    const { t, i18n } = useReactTranslation();

    return {
        t,
        i18n,
        locale: i18n.language,
        locales: ['fr', 'en'],
        changeLocale: (lang) => {
            i18n.changeLanguage(lang);
            localStorage.setItem('language', lang);
        }
    };
};

export default i18n;