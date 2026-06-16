import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(args) {
          console.log('[electron-plugin] onstart called');
          // Copy preload.cjs → dist-electron/preload.js
          const distDir = resolve(__dirname, 'dist-electron');
          if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
          copyFileSync(resolve(__dirname, 'electron/preload.cjs'), resolve(distDir, 'preload.js'));
          args.reload();
        },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
