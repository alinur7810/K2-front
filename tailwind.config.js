/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        earth: {
          surface: '#F4F6F8',
          raised: '#FFFFFF',
          soft: '#F7F9FB',
          line: '#DCE3EA',
          hairline: '#E8EDF2',
          ink: '#0B1F3A',
          slate: '#475569',
          muted: '#64748B',
          blue: '#0B5FA5',
          'blue-hover': '#08487D',
          hydro: '#0284C7',
          rust: '#B4462B',
          amber: '#B45309',
          green: '#4D7C0F',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
        xs: '2px',
        sm: '3px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '10px',
      },
      boxShadow: {
        overlay: '0 10px 30px rgba(11,31,58,0.12), 0 2px 6px rgba(11,31,58,0.06)',
      },
    },
  },
  plugins: [],
};
