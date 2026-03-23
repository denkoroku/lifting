/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        sol: {
          // Solarized light base tones
          base3:  '#fdf6e3', // main background
          base2:  '#eee8d5', // highlighted background
          base1:  '#93a1a1', // comments / muted
          base0:  '#657b83', // body text
          base00: '#586e75', // emphasis
          base01: '#073642', // strong / headings
          // Solarized accent colours
          yellow: '#b58900',
          orange: '#cb4b16',
          red:    '#dc322f',
          green:  '#859900',
          cyan:   '#2aa198',
          blue:   '#268bd2',
          violet: '#6c71c4',
          magenta:'#d33682',
        },
      },
    },
  },
  plugins: [],
}