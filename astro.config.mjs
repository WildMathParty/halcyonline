// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import { themeIntegration } from './src/theme-integration.mjs'

export default defineConfig({
  site: 'https://halcyonline.netlify.app/',
  integrations: [themeIntegration()],
  vite: {
    plugins: [tailwindcss()],
  },
})