/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'hebrew': ['Inter', 'Arial', 'sans-serif'],
      },
      colors: {
        // פלטת צבעים חדשה מותאמת לדגים
        primary: {
          50: '#f0f4ff',
          100: '#e0ecff',
          200: '#c7dcff',
          300: '#a3c7ff',
          400: '#7da8ff',
          500: '#91BBF2', // כחול בהיר ראשי
          600: '#4f8aff',
          700: '#3466ff',
          800: '#2650d9',
          900: '#010B40', // כחול כהה
          950: '#000829',
        },
        accent: {
          50: '#fff1f0',
          100: '#ffe0de',
          200: '#ffc7c2',
          300: '#ffa198',
          400: '#ff6b5e',
          500: '#F26B5E', // אדום בהיר
          600: '#ef4b3d',
          700: '#dc2b1f',
          800: '#b91c1c',
          900: '#A61103', // אדום כהה
          950: '#7f0d03',
        },
        neutral: {
          50: '#fafafa',
          100: '#F2ECE4', // בז' ראשי
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // צבעים מותאמים לחנות דגים
        ocean: {
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
        sea: {
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
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'ocean-gradient': 'linear-gradient(135deg, #91BBF2 0%, #010B40 100%)',
        'warm-gradient': 'linear-gradient(135deg, #F26B5E 0%, #A61103 100%)',
        'neutral-gradient': 'linear-gradient(135deg, #F2ECE4 0%, #e5e5e5 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'modern': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'depth': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

