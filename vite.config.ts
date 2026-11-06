import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { buildServiceWorker } from './src/sw/template';

const page = (path: string): string => fileURLToPath(new URL(path, import.meta.url));
// Files in public/ never reach the bundle, so the ones the app needs offline are named here.
const OFFLINE_EXTRAS = ['fonts/Fredoka-Latin.woff2', 'manifest.webmanifest', 'icons/icon-192.png'];

export default defineConfig({
  // Relative base so the build works on GitHub Pages project sites and locally.
  base: './',
  plugins: [
    {
      // Emits sw.js with the precise list of files this build produced (see src/sw/template.ts).
      name: 'jubilee-offline',
      apply: 'build',
      generateBundle(_options, bundle) {
        const files = [...Object.keys(bundle), ...OFFLINE_EXTRAS];
        const version = createHash('sha256').update([...files].sort().join('\n')).digest('hex').slice(0, 12);
        this.emitFile({ type: 'asset', fileName: 'sw.js', source: buildServiceWorker(files, version) });
      },
    },
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: { input: { landing: page('index.html'), app: page('app/index.html') } },
  },
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
  },
});
