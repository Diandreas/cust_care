// resources/js/app.tsx
import '../css/app.css';
import '../css/calendar.css'; // Import des styles du calendrier
import './bootstrap';
import './i18n'; // Import i18n configuration
// Importer les styles de Sonner
import 'sonner/dist/styles.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Toaster } from './Components/Toaster';

// Script d'initialisation du thème qui s'exécute immédiatement
(function initializeTheme() {
    const STORAGE_KEY = "elitesms-theme";

    // Récupérer le thème depuis localStorage
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    if (storedTheme === "dark" || (storedTheme === "system" && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <App {...props} />
                <Toaster />
            </>
        );
    },
    progress: {
        color: '#8A2BE2',
    },
});