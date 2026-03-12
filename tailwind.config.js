/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f1117',
        panel: '#1a1d2e',
        'panel-light': '#222540',
        accent: '#00d4ff',
        'accent-dim': '#0099bb',
        border: '#2a2d40',
        text: '#e2e8f0',
        'text-dim': '#8892a4',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
