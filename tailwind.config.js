/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFCF5',
          100: '#FFF8EC',
          200: '#FFF1D9',
          300: '#FDE8C0',
        },
        strawberry: {
          50: '#FEF2F4',
          100: '#FDDDE3',
          200: '#FBC1CD',
          300: '#F7A8B8',
          400: '#F08AA0',
          500: '#E96887',
          600: '#D84E70',
          700: '#B83A58',
        },
        choco: {
          400: '#7A5A4E',
          500: '#54382F',
          600: '#462F27',
          700: '#382520',
          800: '#2A1B16',
          900: '#1C1210',
        },
        pistachio: {
          50: '#F2F7E8',
          100: '#E0ECCF',
          200: '#C9DCAE',
          300: '#B9CE91',
          400: '#A0BD72',
          500: '#88A857',
          600: '#6F8C44',
        },
        butter: {
          50: '#FEFBEE',
          100: '#FDF6DA',
          200: '#F4D987',
          300: '#EEC85E',
          400: '#E5B53A',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Nunito"', '"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(84, 56, 47, 0.08)',
        'soft-md': '0 6px 24px -4px rgba(84, 56, 47, 0.12)',
        'soft-lg': '0 12px 40px -8px rgba(84, 56, 47, 0.16)',
        warm: '0 4px 16px -2px rgba(233, 104, 135, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.75rem',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateX(1rem)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        cartBump: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.2s ease-out',
        slideInRight: 'slideInRight 0.2s ease-out',
        popIn: 'popIn 0.18s ease-out',
        fadeInUp: 'fadeInUp 0.3s ease-out',
        cartBump: 'cartBump 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
