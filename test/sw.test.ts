import { describe, expect, it } from 'vitest';
import { buildServiceWorker, precacheList } from '../src/sw/template';

describe('offline service worker', () => {
  const files = ['index.html', 'assets/index-abc.js', 'assets/index-abc.js.map', 'assets/christmas-1.js', 'assets/back-9.svg', 'fonts/Fredoka-Latin.woff2', 'sw.js'];

  it('precaches the shell and every emitted file except maps and itself', () => {
    expect(precacheList(files)).toEqual(['./', './app/', './app/index.html', './assets/back-9.svg', './assets/christmas-1.js', './assets/index-abc.js', './fonts/Fredoka-Latin.woff2', './index.html']);
  });

  it('is versioned, same-origin only and evicts old caches', () => {
    const src = buildServiceWorker(files, 'v123');
    expect(src).toContain('"jubilee-v123"');
    expect(src).toContain('url.origin !== self.location.origin');
    expect(src).toContain("k.startsWith('jubilee-') && k !== CACHE");
    expect(src).not.toMatch(/https?:\/\//);
    expect(() => new Function(src)).not.toThrow();
  });

  it('keeps each page under its own address, so the landing page can never replace the app', () => {
    const src = buildServiceWorker(files, 'v123');
    expect(src).toContain('c.put(req, copy)');
    expect(src).toContain("caches.match('./app/index.html')");
  });
});
