import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        bg: {
          primary: '#F6F7F9',
          card: '#FFFFFF',
          secondary: '#F0F1F3',
        },
        // Semantic colors
        calories: { light: '#10B981', dark: '#34D399' },
        protein: { light: '#6366F1', dark: '#818CF8' },
        carbs: { light: '#F59E0B', dark: '#FBBF24' },
        fat: { light: '#F43F5E', dark: '#FB7185' },
        warning: { light: '#EF4444', dark: '#F87171' },
        success: { light: '#22C55E', dark: '#4ADE80' },
      },
      fontFamily: {
        display: ['-apple-system', 'SF Pro Display', 'system-ui', 'sans-serif'],
        body: ['-apple-system', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
