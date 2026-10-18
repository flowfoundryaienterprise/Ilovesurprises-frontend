import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Split large vendor libraries into their own long-cached chunks.
        codeSplitting: {
          groups: [
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'vendor-motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'vendor-query', test: /node_modules[\\/]@tanstack[\\/]/ },
            { name: 'vendor-icons', test: /node_modules[\\/]lucide-react[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/]/ },
            // Large static catalog data changes independently of app code.
            { name: 'catalog-data', test: /src[\\/]data[\\/]/ },
            { name: 'app-services', test: /src[\\/]services[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'https://api.ilovesurprises.com',
        changeOrigin: true,
        secure: true,
      },
      '/health': {
        target: process.env.VITE_BACKEND_URL || 'https://api.ilovesurprises.com',
        changeOrigin: true,
        secure: true,
      },
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
})