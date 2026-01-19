import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json'

export default defineConfig(() => {
  return {
    plugins: [crx({ manifest })],
    build: {
      sourcemap: false,
      target: 'es2020',
      emptyOutDir: true
    }
  }
})