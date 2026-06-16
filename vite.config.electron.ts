import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'electron/main.ts'),
      formats: ['es'],
      fileName: 'main',
    },
    outDir: 'dist-electron',
    rollupOptions: {
      external: ['electron', 'electron-store'],
      output: {
        format: 'es',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
