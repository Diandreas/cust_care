<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Theme Initialization (prevent flash) -->
        <script>
            (function() {
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
        </script>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
