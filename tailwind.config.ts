import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green:  '#067148',
          hover:  '#045535',
          light:  '#e6f4ee',
        },
      },
      fontFamily: {
        sans:      ['var(--font-montserrat)', 'sans-serif'],
        eurostile: ['var(--font-eurostile)', 'var(--font-montserrat)', 'sans-serif'],
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      // Solo opacidad y la propiedad `translate` (se compone con las clases -translate-x-1/2 ya
      // existentes en vez de pisarlas, y no cuesta layout). Entradas únicamente: nada bloquea clics.
      keyframes: {
        fadeSoft:   { from: { opacity: '0' }, to: { opacity: '1' } },
        menuIn:     { from: { opacity: '0', translate: '0 -6px' }, to: { opacity: '1', translate: '0 0' } },
        riseIn:     { from: { opacity: '0', translate: '0 12px' }, to: { opacity: '1', translate: '0 0' } },
        sheetUp:    { from: { translate: '0 100%' }, to: { translate: '0 0' } },
      },
      animation: {
        'page-enter':  'fadeSoft 350ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-soft':   'fadeSoft 300ms ease-out',
        'menu-in':     'menuIn 250ms cubic-bezier(0.22, 1, 0.36, 1)',
        'rise-in':     'riseIn 350ms cubic-bezier(0.22, 1, 0.36, 1)',
        'sheet-up':    'sheetUp 400ms cubic-bezier(0.22, 1, 0.36, 1)',
        // `backwards`: las tarjetas con retraso se quedan ocultas hasta que les toca entrar.
        'card-in':     'riseIn 450ms cubic-bezier(0.22, 1, 0.36, 1) backwards',
        // El esqueleto espera 200 ms antes de aparecer: si la página carga rápido nunca se ve (sin parpadeo).
        'skeleton-in': 'fadeSoft 400ms ease-out 200ms both',
      },
    },
  },
  plugins: [],
}

export default config
