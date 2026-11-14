/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif TC"', '"Songti TC"', 'SimSun', 'serif'],
        sans: ['"Noto Serif TC"', 'sans-serif'],
        arcade: ['"Press Start 2P"', 'monospace', 'sans-serif'],
      },
      colors: {
        pixel: {
          dark: '#181425',
          darker: '#0e0b16',
          sand: '#eec39a',
          sandDark: '#d9a066',
          water: '#3a80c9',
          waterDeep: '#23599a',
          grass: '#5ea746',
          grassDark: '#387332',
          wood: '#8f563b',
          woodDark: '#663931',
          gold: '#fbb954',
          goldDark: '#d98b2c',
          ruby: '#e43b44',
          arcadePink: '#ff3f8b',
          arcadeCyan: '#00e7ff',
          arcadeYellow: '#ffe600',
        }
      },
      boxShadow: {
        'pixel-sm': '2px 2px 0px 0px rgba(0,0,0,0.85)',
        'pixel': '3px 3px 0px 0px rgba(0,0,0,0.85)',
        'pixel-lg': '5px 5px 0px 0px rgba(0,0,0,0.85)',
        'pixel-inset': 'inset 2px 2px 0px 0px rgba(255,255,255,0.4), inset -2px -2px 0px 0px rgba(0,0,0,0.5)',
        'pixel-btn': '0 4px 0 #000, 0 5px 0 rgba(0,0,0,0.2)',
        'pixel-btn-active': '0 1px 0 #000',
      },
      animation: {
        'jelly': 'jelly 0.4s ease-in-out infinite alternate',
        'bounce-gentle': 'bounceGentle 1.2s ease-in-out infinite alternate',
        'bubble-pop': 'bubblePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'water-flow': 'waterFlow 2s ease-in-out infinite alternate',
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        jelly: {
          '0%': { transform: 'scale(1, 1) translateY(0)' },
          '50%': { transform: 'scale(0.92, 1.08) translateY(-4px)' },
          '100%': { transform: 'scale(1.06, 0.94) translateY(0)' },
        },
        bounceGentle: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-3px)' },
        },
        bubblePop: {
          '0%': { transform: 'scale(0.3) translateY(8px)', opacity: '0' },
          '70%': { transform: 'scale(1.1) translateY(-2px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        waterFlow: {
          '0%': { filter: 'brightness(1) contrast(1)' },
          '100%': { filter: 'brightness(1.1) contrast(1.05)' },
        },
        pulseGlow: {
          '0%': { filter: 'drop-shadow(0 0 2px rgba(255, 230, 0, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 8px rgba(255, 230, 0, 0.9))' },
        }
      }
    },
  },
  plugins: [],
}
