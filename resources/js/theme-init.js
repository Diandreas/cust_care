// Script d'initialisation du thème à inclure dans l'en-tête du document HTML
(function () {
    try {
        const STORAGE_KEY = "elitesms-theme";

        // Récupérer le thème depuis localStorage ou utiliser la préférence système
        const storedTheme = localStorage.getItem(STORAGE_KEY);

        if (storedTheme === "dark") {
            document.documentElement.classList.add('dark');
        } else if (storedTheme === "light") {
            document.documentElement.classList.remove('dark');
        } else {
            // Si aucun thème n'est stocké ou s'il est réglé sur "system", utiliser la préférence système
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            if (prefersDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    } catch (error) {
        // En cas d'erreur, ne pas modifier les classes
        console.error("Erreur lors de l'initialisation du thème:", error);
    }
})(); 