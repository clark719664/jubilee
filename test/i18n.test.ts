import { beforeAll, describe, expect, it } from 'vitest';
import { LANGUAGES, learn, localeFor, t } from '../src/i18n/index';

describe('translation', () => {
  beforeAll(() => learn({ 'Hint': 'Pista', 'Christmas': 'Navidad', 'Back to {holiday}': 'Volver a {holiday}', '{n} of {total} found': '{n} de {total} encontrados', '{name}': '{name}!' }));

  it('translates exact strings and leaves unknown ones alone', () => {
    expect(t('Hint')).toBe('Pista');
    expect(t('  Hint ')).toBe('  Pista ');
    expect(t('Nothing here')).toBe('Nothing here');
  });
  it('fills templates, translating what goes in the slots', () => {
    expect(t('Back to Christmas')).toBe('Volver a Navidad');
    expect(t('3 of 8 found')).toBe('3 de 8 encontrados');
  });
  it('translates allergen lists item by item', () => {
    learn({ 'May contain {list}': 'Puede contener {list}', milk: 'leche', soy: 'soya' });
    expect(t('May contain milk and soy')).toBe('Puede contener leche and soya');
  });
  it('never treats a bare slot as a template, which would match every string', () => {
    expect(t('Some other words')).toBe('Some other words');
  });
  it('never translates its own output again, which would loop forever', () => {
    learn({ Soy: 'Soya (Soy)' });
    const once = t('Soy');
    expect(once).toBe('Soya (Soy)');
    expect(t(once)).toBe(once);
  });
  it('keeps American English as the default language', () => {
    expect(LANGUAGES[0]!.code).toBe('en');
    expect(localeFor('en')).toBe('en-US');
    expect(new Set(LANGUAGES.map((l) => l.code)).size).toBe(LANGUAGES.length);
  });
});
