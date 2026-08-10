import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['forgepath-mark.svg'],
      manifest: {
        name: 'ForgePath Private Alpha',
        short_name: 'ForgePath',
        description: 'A local-first adaptive strength and hypertrophy coach.',
        theme_color: '#111410',
        background_color: '#111410',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'forgepath-mark.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ]
})
