import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Відносні шляхи - щоб збірку можна було викласти будь-куди (GitHub Pages, Netlify, папка).
  base: './',
  plugins: [react()],
})
