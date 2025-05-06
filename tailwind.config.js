import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ['class'],
	content: [
		'./vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
		'./storage/framework/views/*.php',
		'./resources/views/**/*.blade.php',
		'./resources/js/**/*.tsx',
	],

	theme: {
    	extend: {
    		fontFamily: {
    			sans: [
    				'Nunito Sans',
    				'Figtree',
                    ...defaultTheme.fontFamily.sans
                ]
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {
    			blue: {
    				'50': 'var(--blue-50)',
    				'100': 'var(--blue-100)',
    				'200': 'var(--blue-200)',
    				'300': 'var(--blue-300)',
    				'400': 'var(--blue-400)',
    				'500': 'var(--blue-500)',
    				'600': 'var(--blue-600)',
    				'700': 'var(--blue-700)',
    				'800': 'var(--blue-800)',
    				'900': 'var(--blue-900)',
    				'950': 'var(--blue-950)'
    			},
    			orange: {
    				'50': 'var(--orange-50)',
    				'100': 'var(--orange-100)',
    				'200': 'var(--orange-200)',
    				'300': 'var(--orange-300)',
    				'400': 'var(--orange-400)',
    				'500': 'var(--orange-500)',
    				'600': 'var(--orange-600)',
    				'700': 'var(--orange-700)',
    				'800': 'var(--orange-800)',
    				'900': 'var(--orange-900)',
    				'950': 'var(--orange-950)'
    			},
    			green: {
    				'50': 'var(--green-50)',
    				'100': 'var(--green-100)',
    				'200': 'var(--green-200)',
    				'300': 'var(--green-300)',
    				'400': 'var(--green-400)',
    				'500': 'var(--green-500)',
    				'600': 'var(--green-600)',
    				'700': 'var(--green-700)',
    				'800': 'var(--green-800)',
    				'900': 'var(--green-900)',
    				'950': 'var(--green-950)'
    			},
    			purple: {
    				'50': 'var(--purple-50)',
    				'100': 'var(--purple-100)',
    				'200': 'var(--purple-200)',
    				'300': 'var(--purple-300)',
    				'400': 'var(--purple-400)',
    				'500': 'var(--purple-500)',
    				'600': 'var(--purple-600)',
    				'700': 'var(--purple-700)',
    				'800': 'var(--purple-800)',
    				'900': 'var(--purple-900)',
    				'950': 'var(--purple-950)'
    			},
    			gold: {
    				'50': 'var(--gold-50)',
    				'100': 'var(--gold-100)',
    				'200': 'var(--gold-200)',
    				'300': 'var(--gold-300)',
    				'400': 'var(--gold-400)',
    				'500': 'var(--gold-500)',
    				'600': 'var(--gold-600)',
    				'700': 'var(--gold-700)',
    				'800': 'var(--gold-800)',
    				'900': 'var(--gold-900)',
    				'950': 'var(--gold-950)'
    			},
    			kente: {
    				gold: 'var(--kente-gold)',
    				red: 'var(--kente-red)',
    				blue: 'var(--kente-blue)'
    			},
    			charcoal: {
    				DEFAULT: 'var(--charcoal)',
    				light: 'var(--charcoal-light)',
    				lightest: 'var(--charcoal-lightest)'
    			},
    			whisper: 'var(--whisper)',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		}
    	}
    },

	plugins: [forms, require("tailwindcss-animate")],
};