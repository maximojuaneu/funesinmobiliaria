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
    },
  },
  plugins: [],
}

export default config
