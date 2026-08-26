import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'forgepath-local-http-csp',
      transformIndexHtml(html, context) {
        if (!context.server) return html
        // Production is HTTPS and retains upgrade-insecure-requests. Local iPhone/WebKit
        // acceptance runs on loopback HTTP, where WebKit otherwise upgrades Vite modules
        // to an unavailable HTTPS endpoint and leaves only the static skip link visible.
        return html.replace('; upgrade-insecure-requests', '')
      }
    },
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['forgepath-mark.svg'],
      manifest: {
        name: 'ForgePath Private Alpha',
        short_name: 'ForgePath',
        description: 'A private cloud-backed adaptive strength and hypertrophy coach.',
        theme_color: '#111410',
        background_color: '#111410',
        display: 'standalone',
        id: base,
        start_url: base,
        scope: base,
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
        cacheId: 'forgepath',
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ]
})
