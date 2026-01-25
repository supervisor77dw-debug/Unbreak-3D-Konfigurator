import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Optimize chunk splitting for better caching and loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React core into its own chunk
          'react-vendor': ['react', 'react-dom'],
          // Split Three.js ecosystem (largest payload)
          'three-vendor': ['three'],
          'drei-vendor': ['@react-three/drei'],
          'fiber-vendor': ['@react-three/fiber'],
        },
      },
    },
    // Target modern browsers for smaller output
    target: 'es2020',
    // Increase chunk size warning limit (Three.js ecosystem is ~720KB gzipped)
    chunkSizeWarningLimit: 800,
  },
  // Optimize dev server
  server: {
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/components/UI/TopBar.jsx',
      ],
    },
  },
})
