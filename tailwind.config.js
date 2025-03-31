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
				// Brand colors from HelloBoost visual style guide
				blue: {
					50: '#E6F0FF',
					100: '#CCE0FF',
					200: '#99C1FF',
					300: '#66A3FF',
					400: '#3385FF',
					500: '#1A75FF', // HelloBoost Blue (Primary)
					600: '#0066FF',
					700: '#0052CC',
					800: '#003D99',
					900: '#002966',
					950: '#001A40',
				},
				orange: {
					50: '#FFF0E6',
					100: '#FFE1CC',
					200: '#FFC399',
					300: '#FFA566',
					400: '#FF8733',
					500: '#FF7D26', // HelloBoost Orange
					600: '#FF6600',
					700: '#CC5200',
					800: '#993D00',
					900: '#662900',
					950: '#401A00',
				},
				green: {
					50: '#E6F7F2',
					100: '#CCEFE4',
					200: '#99DFC9',
					300: '#66D0AF',
					400: '#33C094',
					500: '#26B887', // HelloBoost Green
					600: '#1FA679',
					700: '#19856F',
					800: '#136452',
					900: '#0C4236',
					950: '#08281F',
				},
				purple: {
					50: '#EFEAFF',
					100: '#DED5FF',
					200: '#BDABFF',
					300: '#9C82FF',
					400: '#7B58FF',
					500: '#6B48FF', // HelloBoost Purple
					600: '#5A37FF',
					700: '#482CCC',
					800: '#362199',
					900: '#241666',
					950: '#170E40',
				},
				gold: {
					50: '#FFFAEB',
					100: '#FFF5D6',
					200: '#FFEBAD',
					300: '#FFE085',
					400: '#FFD85C',
					500: '#FFD54D', // HelloBoost Gold
					600: '#FFCA1A',
					700: '#E6B400',
					800: '#B38C00',
					900: '#806400',
					950: '#4D3C00',
				},
				// Cultural accent colors
				kente: {
					gold: '#FFBA00',
					red: '#E03616',
					blue: '#334C8F',
				},
				// Neutral colors
				charcoal: {
					DEFAULT: '#222222', // Deep Charcoal
					light: '#555555', // Graphite
					lightest: '#ACACAC', // Silver
				},
				whisper: '#F5F5F5',

				// System colors (following the shadcn structure)
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
				}
			}
		}
	},

	plugins: [forms, require("tailwindcss-animate")],
};