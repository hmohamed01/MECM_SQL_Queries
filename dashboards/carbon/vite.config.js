import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Carbon's SCSS references IBM Plex fonts with the webpack-style "~@ibm/plex" prefix.
  resolve: { alias: [{ find: /^~(@ibm\/.*)$/, replacement: '$1' }] },
  css: { preprocessorOptions: { scss: { quietDeps: true, silenceDeprecations: ['import', 'global-builtin'] } } },
  build: { chunkSizeWarningLimit: 3000 },
})
