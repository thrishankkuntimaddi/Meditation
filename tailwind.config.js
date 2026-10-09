/** @type {import('tailwindcss').Config} */
const token = name => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Semantic tokens over the original stone palette (light + dark in index.css)
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        surface2: token('surface-2'),
        ink: token('ink'),
        ink2: token('ink-2'),
        muted: token('muted'),
        faint: token('faint'),
        line: token('line'),
        danger: token('danger'),
        ok: token('ok'),
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      letterSpacing: {
        eyebrow: '0.2em',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.35s ease-out both',
        'pulse-ring': 'pulseRing 4s ease-in-out infinite',
        'sheet-in': 'sheetIn 0.28s cubic-bezier(.2,.8,.2,1) both',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseRing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.55' },
          '50%': { transform: 'scale(1.06)', opacity: '0.25' },
        },
        sheetIn: {
          '0%': { transform: 'translateY(24px) scale(0.98)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
