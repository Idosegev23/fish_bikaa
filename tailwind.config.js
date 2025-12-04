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
        // פלטת צבעים בוטיקית-מינימליסטית
        cream: '#F8F6F3',
        sand: '#E8E4DE',
        charcoal: '#1A1A1A',
        stone: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C',
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
        },
        // אקסנט זהב מושתק
        gold: {
          50: '#FAF8F5',
          100: '#F5EFE6',
          200: '#E8DCC8',
          300: '#D4C4A8',
          400: '#B8A07A',
          500: '#9C7C52',
          600: '#836841',
          700: '#6B5536',
          800: '#54432B',
          900: '#3D3120',
        },
        // כחול ים כהה
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
        },
      },
      boxShadow: {
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'elegant': '0 8px 32px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '6px',
        'lg': '8px',
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
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'elegant': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
