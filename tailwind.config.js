/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#F5F6FA',
        surface: '#FFFFFF',
        panel: '#FFFFFF',
        border: '#E5E7EB',
        muted: '#F3F4F6',
      },
    },
  },
  plugins: [],
}
