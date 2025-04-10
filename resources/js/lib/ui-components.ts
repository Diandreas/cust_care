/**
 * Configuration des composants UI
 * Ce fichier permet de personnaliser l'apparence des composants en utilisant
 * les variables du thème centralisé
 */

export const uiConfig = {
  // Configuration des composants Card
  card: {
    base: 'border-0 bg-white dark:bg-gray-900/60 shadow-md rounded-lg overflow-hidden',
    header: 'p-3 border-b',
    headerTitle: 'text-sm font-semibold text-primary',
    headerIcon: 'h-4 w-4 text-primary',
    content: 'p-4',
  },
  
  // Configuration des tableaux
  table: {
    header: 'hover:bg-transparent bg-primary/5 dark:bg-primary/10',
    headerCell: 'text-xs font-medium text-primary h-8',
    row: 'h-10 hover:bg-primary/5 dark:hover:bg-primary/10',
    cell: 'text-xs py-1',
    emptyMessage: 'text-center text-xs text-muted-foreground',
  },
  
  // Configuration des graphiques
  chart: {
    colors: [
      'var(--blue-500)',
      'var(--green-500)',
      'var(--purple-500)',
      'var(--orange-500)',
      'var(--gold-500)',
    ],
    statusColors: {
      success: 'var(--green-500)',
      warning: 'var(--orange-400)',
      danger: 'var(--kente-red)',
      info: 'var(--blue-500)',
      neutral: 'var(--charcoal-light)',
    }
  },
  
  // Configuration des badges
  badge: {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },

  // Configuration des statistiques
  stats: {
    cardBase: 'p-4 rounded-lg border border-primary/10 bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-gray-900',
    icon: 'h-8 w-8 mb-2 text-primary',
    value: 'text-xl font-bold text-primary',
    label: 'text-sm text-muted-foreground',
  },

  // Configuration des alertes
  alert: {
    success: 'border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20',
    warning: 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20',
    danger: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20',
    info: 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  },
};
