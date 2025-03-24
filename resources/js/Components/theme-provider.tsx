import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Nom de la clé de stockage par défaut pour l'application
const DEFAULT_STORAGE_KEY = "elitesms-theme"

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = DEFAULT_STORAGE_KEY,
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== "undefined") {
            // Essayer de récupérer le thème depuis localStorage
            const storedTheme = localStorage.getItem(storageKey)
            if (storedTheme && (storedTheme === "dark" || storedTheme === "light" || storedTheme === "system")) {
                return storedTheme as Theme
            }

            // Si aucun thème n'est stocké, vérifier la préférence système
            const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light"

            // Stocker cette préférence pour les visites futures
            localStorage.setItem(storageKey, systemPreference)
            return systemPreference as Theme
        }
        return defaultTheme
    })

    // Effet pour initialiser le thème lors du montage du composant
    useEffect(() => {
        const root = window.document.documentElement

        // Fonction pour appliquer le thème
        const applyTheme = (selectedTheme: Theme) => {
            root.classList.remove("light", "dark")

            if (selectedTheme === "system") {
                const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                    ? "dark"
                    : "light"
                root.classList.add(systemTheme)
            } else {
                root.classList.add(selectedTheme)
            }
        }

        // Appliquer le thème initial
        applyTheme(theme)

        // Configurer l'écouteur pour les changements de préférence système
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
        const handleChange = () => {
            if (theme === "system") {
                applyTheme("system")
            }
        }

        mediaQuery.addEventListener("change", handleChange)
        return () => mediaQuery.removeEventListener("change", handleChange)
    }, [theme])

    // Effet pour persister les changements de thème
    useEffect(() => {
        localStorage.setItem(storageKey, theme)
    }, [theme, storageKey])

    const value = {
        theme,
        setTheme: (newTheme: Theme) => {
            localStorage.setItem(storageKey, newTheme)
            setTheme(newTheme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider")
    }
    return context
}
