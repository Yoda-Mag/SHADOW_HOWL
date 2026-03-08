import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Handle process.env in ESM - use optional chaining to avoid linting errors
const apiUrl = (typeof process !== 'undefined' && process.env?.VITE_API_URL) || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    // Proxy API requests to backend in development
    proxy: {
      '/api': {
        target: apiUrl,
        changeOrigin: true,
      }
    }
  },
  define: {
    // Make environment variable available in app
    'import.meta.env.VITE_API_URL': JSON.stringify(
      apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`
    ),
  },
  build: {
    // Optimize bundle size
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'axios', 'react-router-dom'],
        }
      }
    }
  }
})
