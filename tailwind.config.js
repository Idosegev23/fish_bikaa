/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Playfair Display', 'Frank Ruhl Libre', 'Georgia', 'serif'],
        'sans': ['Heebo', 'Assistant', 'Arial', 'sans-serif'],
        'hebrew': ['Heebo', 'Arial', 'sans-serif'],
      },
      colors: {
        // פלטת צבעים ימית - Ocean Forces
        ocean: {
          // Primary - כחול כהה עמוק
          primary: '#023859',
          // Secondary - תכלת בהיר
          secondary: '#6FA8BF',
          // Dark - כחול-ירוק כהה
          dark: '#013440',
          // Light - תכלת בהיר מאוד
          light: '#B4D2D9',
          // Accent - טורקיז כהה
          accent: '#026873',
        },
        // רקעים בהירים
        white: '#FFFFFF',
        offwhite: '#FAFCFD',
        cream: '#F5F9FA',
        // גווני אפור-כחול
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(2, 56, 89, 0.04)',
        'soft': '0 2px 8px rgba(2, 56, 89, 0.08)',
        'medium': '0 4px 16px rgba(2, 56, 89, 0.12)',
        'elegant': '0 8px 32px rgba(2, 56, 89, 0.12)',
        'ocean': '0 4px 20px rgba(2, 104, 115, 0.15)',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      fontSize: {
        'display': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h1': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h2': ['2rem', { lineHeight: '1.3' }],
        'h3': ['1.5rem', { lineHeight: '1.4' }],
        'h4': ['1.25rem', { lineHeight: '1.5' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'small': ['0.875rem', { lineHeight: '1.5' }],
        'tiny': ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'wave': 'wave 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      transitionTimingFunction: {
        'elegant': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backgroundImage: {
        'ocean-gradient': 'linear-gradient(135deg, #023859 0%, #026873 50%, #6FA8BF 100%)',
        'ocean-light': 'linear-gradient(180deg, #FFFFFF 0%, #F5F9FA 50%, #B4D2D9 100%)',
        'ocean-subtle': 'linear-gradient(180deg, #FAFCFD 0%, #F5F9FA 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
