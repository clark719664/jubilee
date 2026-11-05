import { createHash } from 'node:crypto';
import { defineConfig } from 'vitest/config';
import { buildServiceWorker } from './src/sw/template';

export default defineConfig({
  // Relative base so the build works on GitHub Pages project sites and locally.
  base: './',
  plugins: [
    {
      // Emits sw.js with the precise list of files this build produced (see src/sw/template.ts).
      name: 'jubilee-offline',
      apply: 'build',
      generateBundle(_options, bundle) {
        const files = Object.keys(bundle);
        const version = createHash('sha256').update([...files].sort().join('\n')).digest('hex').slice(0, 12);
        this.emitFile({ type: 'asset', fileName: 'sw.js', source: buildServiceWorker(files, version) });
      },
    },
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    include: ['test/**/*.test.ts'],
    setupFiles: ['test/setup.ts'],
  },
});
