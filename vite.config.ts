import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      workbox: {
        // Increase the size limit for files to be precached
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
        // Skip waiting on install to make updates activate faster
        skipWaiting: true,
        // Don't wait for clients to close before activating new service worker
        clientsClaim: true
      },
      manifest: {
        name: 'متجري',
        short_name: 'متجري',
        application_name: 'متجري',
        description: 'نظام نقاط البيع لإدارة متجرك بكفاءة عالية',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'https://i.ibb.co/7dYt1R1T/monitor.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://i.ibb.co/7dYt1R1T/monitor.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'https://i.ibb.co/7dYt1R1T/monitor.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        // Configure manual chunks to split the bundle
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast', 'tailwindcss'],
          supabase: ['@supabase/supabase-js'],
          // Add more chunks as needed
        }
      }
    },
    // Increase the warning limit for chunk sizes
    chunkSizeWarningLimit: 1000
  }
})