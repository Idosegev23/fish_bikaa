/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'hebrew': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // פלטת ים ומים מקצועית
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        deep: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        wave: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        sand: {
          50: '#fefbf3',
          100: '#fdf6e3',
          200: '#f9e8c1',
          300: '#f4d995',
          400: '#edc254',
          500: '#e6a823',
          600: '#d1901a',
          700: '#ae7418',
          800: '#8d5d1a',
          900: '#744c19',
        },
        coral: {
          50: '#fef7f0',
          100: '#feeee0',
          200: '#fcd9bf',
          300: '#f9bf93',
          400: '#f59e65',
          500: '#f2844c',
          600: '#e36d32',
          700: '#bc5428',
          800: '#964227',
          900: '#793923',
        }
      },
      backgroundImage: {
        'ocean-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #075985 100%)',
        'deep-gradient': 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
        'wave-gradient': 'linear-gradient(135deg, #ecfeff 0%, #cffafe 50%, #a5f3fc 100%)',
        'surface-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'depth-texture': 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.02) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.02) 75%)',
      },
      boxShadow: {
        'ocean': '0 4px 20px rgba(14, 165, 233, 0.15)',
        'ocean-lg': '0 8px 30px rgba(14, 165, 233, 0.2)',
        'deep': '0 10px 40px rgba(15, 23, 42, 0.15)',
        'wave': '0 4px 16px rgba(6, 182, 212, 0.12)',
        'surface': '0 2px 8px rgba(148, 163, 184, 0.08)',
        'depth': '0 20px 60px rgba(15, 23, 42, 0.2)',
        'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'large': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'wave': 'wave 3s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out',
        'flow': 'flow 4s ease-in-out infinite',
        'surface': 'surface 2s ease-in-out infinite',
        'depth': 'depth 5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(1deg)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        flow: {
          '0%, 100%': { transform: 'translateX(0%) skewX(0deg)' },
          '50%': { transform: 'translateX(1%) skewX(0.5deg)' },
        },
        surface: {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '0.9' },
        },
        depth: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-2px) scale(1.01)' },
        }
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(16px)',
        'blur-sm': 'blur(8px)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

