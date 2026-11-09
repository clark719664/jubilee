import { describe, expect, it } from 'vitest';
import { fill, learn, list, plural, t } from '../src/i18n/index';

const LANTERNS = { one: '{n} lantern', other: '{n} lanterns' } as const;

describe('counts', () => {
  it('picks the English form with plural rules, not n === 1 alone', () => {
    expect(plural(1, LANTERNS)).toBe('1 lantern');
    expect(plural(0, LANTERNS)).toBe('0 lanterns');
    expect(plural(2, LANTERNS)).toBe('2 lanterns');
    expect(plural(1234, LANTERNS)).toBe('1,234 lanterns');
    expect(plural(1.5, LANTERNS, { n: '1½' })).toBe('1½ lanterns');
    expect(plural(0.5, { one: '{n} cup', other: '{n} cups' }, { n: '½' })).toBe('½ cup');
  });

  it('gives Russian its one, few and many forms', () => {
    learn({ '{n} lanterns': { one: '{n} фонарик', few: '{n} фонарика', many: '{n} фонариков', other: '{n} фонарика' } }, 'ru');
    expect([1, 2, 5, 11, 21, 22, 25].map((n) => plural(n, LANTERNS))).toEqual(
      ['1 фонарик', '2 фонарика', '5 фонариков', '11 фонариков', '21 фонарик', '22 фонарика', '25 фонариков']);
    expect(plural(1.5, LANTERNS, { n: '1½' })).toBe('1½ фонарика');
    expect(plural(0.5, LANTERNS, { n: '½' })).toBe('½ фонарика');
  });

  it('gives Arabic all six forms', () => {
    learn({ '{n} lanterns': { zero: '{n} فانوس', one: 'فانوس واحد', two: 'فانوسان', few: '{n} فوانيس', many: '{n} فانوسًا', other: '{n} فانوس' } }, 'ar');
    expect([0, 1, 2, 3, 11, 100].map((n) => plural(n, LANTERNS))).toEqual(
      ['0 فانوس', 'فانوس واحد', 'فانوسان', '3 فوانيس', '11 فانوسًا', '100 فانوس']);
  });

  it('gives Japanese its single form, with Latin digits like the rest of the app', () => {
    learn({ '{n} lanterns': { other: 'ちょうちん{n}こ' } }, 'ja');
    expect(plural(1, LANTERNS)).toBe('ちょうちん1こ');
    expect(plural(1000, LANTERNS)).toBe('ちょうちん1,000こ');
  });

  it('never translates a count twice', () => {
    learn({ '{n} lanterns': { other: 'ちょうちん{n}こ' } }, 'ja');
    const once = plural(3, LANTERNS);
    expect(t(once)).toBe(once);
  });

  it('translates the other slots in a count', () => {
    learn({ 'Christmas': 'クリスマス', '{n} sleeps until {name}': { other: '{name}まであと{n}回ねると' } }, 'ja');
    expect(plural(3, { one: '{n} sleep until {name}', other: '{n} sleeps until {name}' }, { name: 'Christmas' })).toBe('クリスマスまであと3回ねると');
  });

  it('keeps English when a count has no translation yet', () => {
    learn({}, 'de');
    expect(plural(2, { one: '{n} star', other: '{n} stars' })).toBe('2 stars');
  });
});

describe('lists', () => {
  it('keeps the English "a, b and c" style', () => {
    learn({}, 'en');
    expect(list(['milk', 'wheat', 'soy'])).toBe('milk, wheat and soy');
    expect(list(['milk', 'soy'])).toBe('milk and soy');
  });

  it('joins translated items the reader’s way', () => {
    learn({ milk: 'leche', wheat: 'trigo', soy: 'soya' }, 'es');
    expect(list(['milk', 'wheat', 'soy'])).toBe('leche, trigo y soya');
    learn({ 'May contain {list}': 'Puede contener {list}' }, 'es');
    expect(t('May contain milk, wheat and soy')).toBe('Puede contener leche, trigo y soya');
  });

  it('leaves a sentence with a comma alone', () => {
    learn({ milk: 'leche' }, 'es');
    expect(list(['Hello, friend'])).toBe('Hello, friend');
  });
});

describe('joined sentences', () => {
  it('translates sentences joined for a screen reader one by one', () => {
    learn({ 'You found the {thing}!': '¡Encontraste {thing}!', star: 'la estrella', '{n} more to find.': 'Faltan {n}.' }, 'es');
    expect(t('You found the star! 3 more to find.')).toBe('¡Encontraste la estrella! Faltan 3.');
  });
});

describe('templates that would match too much', () => {
  it('never lets a bare "{name} and {name}" rewrite any sentence with "and" in it', () => {
    learn({ '{name} and {name}': '{name}と{name}' }, 'ja');
    expect(t('Pick pictures with the arrow keys and Enter')).toBe('Pick pictures with the arrow keys and Enter');
  });
  it('only fills a number slot with a number', () => {
    learn({ 'Color {n}': '色：{n}', 'Color Thrower': '色なげ名人' }, 'ja');
    expect(t('Color 3')).toBe('色：3');
    expect(t('Color Thrower')).toBe('色なげ名人');
    learn({ 'Door {n}': 'ドア {n}' }, 'ja');
    expect(t('Door Prize')).toBe('Door Prize');
  });
  it('skips scraps where a slot is glued to a word', () => {
    learn({ '{name}ka Dahan (bonfire night': '{name}カ・ダハン', '{name}day pages visited': 'x' }, 'ja');
    expect(t('Holika Dahan (bonfire night')).toBe('Holika Dahan (bonfire night');
  });
  it('never squeezes a sentence into a name slot', () => {
    learn({ 'The year that begins on {name}': '{name}に始まる年' }, 'ja');
    expect(t('The year that begins on Monday; UTC+8')).toBe('The year that begins on Monday; UTC+8');
  });
  it('picks the template that fits best when several match', () => {
    learn({ '{holiday} green': '{holiday}の緑', '{holiday} pine green': '{holiday}のもみの木色', Christmas: 'クリスマス' }, 'ja');
    expect(t('Christmas pine green')).toBe('クリスマスのもみの木色');
    expect(t('Christmas green')).toBe('クリスマスの緑');
  });
  it('translates text in quotes even when it ends in a bracket', () => {
    learn({ 'Happy Christmas (Navidad means Nativity)': 'メリークリスマス（ナビダは降誕のこと）' }, 'ja');
    expect(t('“Happy Christmas (Navidad means Nativity)”')).toBe('“メリークリスマス（ナビダは降誕のこと）”');
  });
  it('keeps a greeting taught as written, holiday name and all', () => {
    learn({ '{name} Mubarak': '{name} Mubarak', Ramadan: 'ラマダン', '{view} · Jubilee': '{view} · Jubilee', Holiday: 'おいわい' }, 'ja');
    expect(t('Ramadan Mubarak')).toBe('Ramadan Mubarak');
    expect(t('Holiday · Jubilee')).toBe('おいわい · Jubilee');
  });
  it('finds a slot value however the code writes it', () => {
    learn({ 'Hiding place: {place}. Look behind it.': '隠し場所：{place}。', Barrel: 'たる', 'a candle': 'ろうそく', 'Find the {thing}': '{thing}を探そう' }, 'ja');
    expect(t('Hiding place: the barrel. Look behind it.')).toBe('隠し場所：たる。');
    expect(t('Find the candle')).toBe('ろうそくを探そう');
  });
  it('translates a filled-in template inside a slot', () => {
    learn({ 'We decide this day by a rule ({rule}).': 'ルール（{rule}）で決めます。', '{date} every year': '毎年{date}', 'October 31': '10月31日' }, 'ja');
    expect(t('We decide this day by a rule (October 31 every year).')).toBe('ルール（毎年10月31日）で決めます。');
  });
});

describe('fill', () => {
  it('fills named slots and leaves unknown ones', () => {
    expect(fill('Postcard from {city}', { city: 'Paris' })).toBe('Postcard from Paris');
    expect(fill('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
});
