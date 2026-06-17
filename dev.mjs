import { spawn } from 'child_process';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { buildSync } from 'esbuild';

const root = resolve(import.meta.dirname);

// Build preload.cjs from preload.ts
buildSync({
  entryPoints: [resolve(root, 'electron/preload.ts')],
  bundle: true,
  platform: 'node',
  outfile: resolve(root, 'electron/preload.cjs'),
  external: ['electron'],
  format: 'cjs',
});

// Copy to dist-electron
const preloadDest = resolve(root, 'dist-electron/preload.js');
if (!existsSync(resolve(root, 'dist-electron'))) {
  mkdirSync(resolve(root, 'dist-electron'), { recursive: true });
}
copyFileSync(resolve(root, 'electron/preload.cjs'), preloadDest);

// Start Vite dev server
console.log('[dev] Starting Vite dev server...');
const vite = spawn('npx', ['vite'], { cwd: root, stdio: 'inherit', shell: true });

// Start Electron with tsx
setTimeout(() => {
  console.log('[dev] Starting Electron...');
  const electron = spawn('npx', ['tsx', 'electron/main.ts'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, VITE_DEV_SERVER_URL: 'http://localhost:5173' },
  });

  electron.on('close', () => {
    vite.kill();
    process.exit(0);
  });
}, 2000);

vite.on('close', () => {
  process.exit(0);
});
