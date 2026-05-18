import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-libs': ['pdf-lib', '@pdf-lib/fontkit', 'jspdf', 'jspdf-autotable'],
          'charts': ['chart.js', 'react-chartjs-2', 'recharts'],
        }
      }
    }
  }
})
