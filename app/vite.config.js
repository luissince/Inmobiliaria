import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // million.vite({ auto: true }),
    react()],
  server: {
    port: 3001,
  },
  preview: {
    host: "0.0.0.0"
  }
})
