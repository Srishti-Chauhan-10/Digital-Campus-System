/** @type {import('tailwindcss').Config} */
export default {
  content: ['./client/index.html', './client/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // લોગો અને બ્રાન્ડ
        brand: {
          50: '#F4F9F1',
          100: '#E4F0DE',
          200: '#C7DDAA',
          300: '#9DBF7C',
          400: '#7FA05E',
          500: '#5C7A43',
          600: '#456035',
          700: '#33492A',
          800: '#22331D',
          900: '#173020',
        },
        // ગોલ્ડ
        gold: {
          100: '#FFF7DC',
          200: '#FFEFB5',
          300: '#FFE08A',
          400: '#E8C566',
          500: '#C9A227',
          600: '#A9831C',
        },
        // આપવેલ UI/UX પેલેટ
        matcha: '#9DBF7C',
        linden: '#C7DDAA',
        citron: '#FFF2A6',
        kiwi: '#E6F0C3',
        latte: '#A7BC9A',
        sky: '#A8C6E7',
        sunwash: '#FFE08A',
        cloud: '#FFF7D6',
        breeze: '#7FA8D6',
        cream: '#FBF8EF',
        ink: '#22331D',
      },
      fontFamily: {
        sans: [
          'Noto Sans Gujarati', 'Shruti', 'Gujarati Sangam MN', 'Noto Sans',
          'Segoe UI', 'system-ui', 'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23,48,32,.04), 0 8px 24px -8px rgba(23,48,32,.12)',
        lift: '0 2px 4px rgba(23,48,32,.05), 0 16px 40px -12px rgba(23,48,32,.22)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
