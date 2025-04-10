/**
 * Utilitaires pour appliquer le thème centralisé dans l'application
 */

// Convertit les variables CSS en valeurs utilisables dans les styles JS
export const cssVar = (name: string): string => {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

// Récupère une couleur du thème par son nom et sa variante
export const getThemeColor = (color: string, shade: number = 500): string => {
  return `var(--${color}-${shade})`;
};

// Mappe les noms de couleurs sémantiques à leur variable CSS correspondante
export const themeColors = {
  // Couleurs principales
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  accent: 'var(--accent)',
  muted: 'var(--muted)',
  
  // Couleurs de marque
  blue: {
    50: 'var(--blue-50)',
    100: 'var(--blue-100)',
    200: 'var(--blue-200)',
    300: 'var(--blue-300)',
    400: 'var(--blue-400)',
    500: 'var(--blue-500)',
    600: 'var(--blue-600)',
    700: 'var(--blue-700)',
    800: 'var(--blue-800)',
    900: 'var(--blue-900)',
    950: 'var(--blue-950)',
  },
  
  green: {
    50: 'var(--green-50)',
    100: 'var(--green-100)',
    200: 'var(--green-200)',
    300: 'var(--green-300)',
    400: 'var(--green-400)',
    500: 'var(--green-500)',
    600: 'var(--green-600)',
    700: 'var(--green-700)',
    800: 'var(--green-800)',
    900: 'var(--green-900)',
    950: 'var(--green-950)',
  },
  
  orange: {
    50: 'var(--orange-50)',
    100: 'var(--orange-100)',
    200: 'var(--orange-200)',
    300: 'var(--orange-300)',
    400: 'var(--orange-400)',
    500: 'var(--orange-500)',
    600: 'var(--orange-600)',
    700: 'var(--orange-700)',
    800: 'var(--orange-800)',
    900: 'var(--orange-900)',
    950: 'var(--orange-950)',
  },
  
  purple: {
    50: 'var(--purple-50)',
    100: 'var(--purple-100)',
    200: 'var(--purple-200)',
    300: 'var(--purple-300)',
    400: 'var(--purple-400)',
    500: 'var(--purple-500)',
    600: 'var(--purple-600)',
    700: 'var(--purple-700)',
    800: 'var(--purple-800)',
    900: 'var(--purple-900)',
    950: 'var(--purple-950)',
  },
  
  gold: {
    50: 'var(--gold-50)',
    100: 'var(--gold-100)',
    200: 'var(--gold-200)',
    300: 'var(--gold-300)',
    400: 'var(--gold-400)',
    500: 'var(--gold-500)',
    600: 'var(--gold-600)',
    700: 'var(--gold-700)',
    800: 'var(--gold-800)',
    900: 'var(--gold-900)',
    950: 'var(--gold-950)',
  },
  
  // Couleurs spéciales
  success: 'var(--green-500)',
  warning: 'var(--orange-500)',
  danger: 'var(--kente-red)',
  info: 'var(--blue-500)',
};
