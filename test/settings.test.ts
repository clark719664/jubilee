import { describe, expect, it } from 'vitest';
import { detectRegion, resolveMotion, resolveScheme, resolveUnits } from '../src/app/settings';

describe('settings: detectRegion', () => {
  it('maps the documented languages', () => {
    expect(detectRegion('en-GB')).toBe('GB');
    expect(detectRegion('en-CA')).toBe('CA');
    expect(detectRegion('en-AU')).toBe('AU');
    expect(detectRegion('es-MX')).toBe('MX');
    expect(detectRegion('en-IN')).toBe('IN');
    expect(detectRegion('hi-IN')).toBe('IN');
    expect(detectRegion('fr')).toBe('FR');
    expect(detectRegion('fr-FR')).toBe('FR');
    expect(detectRegion('fr-CA')).toBe('FR');
    expect(detectRegion('en-US')).toBe('US');
  });

  it('is case/underscore tolerant and defaults to OTHER', () => {
    expect(detectRegion('en_gb')).toBe('GB');
    expect(detectRegion('EN-us')).toBe('US');
    expect(detectRegion('en')).toBe('OTHER');
    expect(detectRegion('es')).toBe('OTHER');
    expect(detectRegion('de-DE')).toBe('OTHER');
    expect(detectRegion('')).toBe('OTHER');
    expect(detectRegion(undefined)).toBe('OTHER');
  });
});

describe('settings: resolution', () => {
  it('motion: query > saved > media', () => {
    expect(resolveMotion('on', 'off', true)).toBe('full');
    expect(resolveMotion('off', 'on', false)).toBe('off');
    expect(resolveMotion(undefined, 'on', true)).toBe('full');
    expect(resolveMotion(undefined, 'off', false)).toBe('off');
    expect(resolveMotion(undefined, 'auto', true)).toBe('reduced');
    expect(resolveMotion(undefined, 'auto', false)).toBe('full');
  });

  it('units: saved wins, else US gets cups', () => {
    expect(resolveUnits('metric', 'US')).toBe('metric');
    expect(resolveUnits(undefined, 'US')).toBe('us');
    expect(resolveUnits(undefined, 'GB')).toBe('metric');
    expect(resolveUnits(undefined, 'OTHER')).toBe('metric');
  });

  it('scheme: saved wins, else the OS', () => {
    expect(resolveScheme('light', true)).toBe('light');
    expect(resolveScheme(undefined, true)).toBe('dark');
    expect(resolveScheme(undefined, false)).toBe('light');
  });
});
