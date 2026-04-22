// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'
import { themeIntegration } from './src/theme-integration.mjs'

import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://halcyonline.netlify.app/',
  integrations: [themeIntegration(), svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
})