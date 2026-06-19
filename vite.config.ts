import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { buildSync } from 'esbuild';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['koffi'],
            },
          },
        },
        onstart(args) {
          console.log('[electron-plugin] onstart called');
          // Build preload.cjs from preload.ts
          buildSync({
            entryPoints: [resolve(__dirname, 'electron/preload.ts')],
            bundle: true,
            platform: 'node',
            outfile: resolve(__dirname, 'electron/preload.cjs'),
            external: ['electron'],
            format: 'cjs',
          });
          // Copy to dist-electron
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
