import { describe, expect, it } from 'vitest';
import {
  commaNumber, convertMeasure, formatMeasure, formatMeasureText, fractionText, minutesToText, ordinal, pluralSleeps, roundFriendly, toMetric, toUs,
} from '../src/app/format';

describe('format: numbers and words', () => {
  it('ordinals', () => {
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
    expect(ordinal(4)).toBe('4th');
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(12)).toBe('12th');
    expect(ordinal(13)).toBe('13th');
    expect(ordinal(21)).toBe('21st');
    expect(ordinal(101)).toBe('101st');
    expect(ordinal(112)).toBe('112th');
  });

  it('commaNumber groups thousands', () => {
    expect(commaNumber(0)).toBe('0');
    expect(commaNumber(999)).toBe('999');
    expect(commaNumber(1096)).toBe('1,096');
    expect(commaNumber(1234567)).toBe('1,234,567');
    expect(commaNumber(-1096)).toBe('-1,096');
  });

  it('pluralSleeps', () => {
    expect(pluralSleeps(0)).toBe('0 sleeps');
    expect(pluralSleeps(1)).toBe('1 sleep');
    expect(pluralSleeps(2)).toBe('2 sleeps');
    expect(pluralSleeps(1096)).toBe('1,096 sleeps');
  });

  it('minutesToText', () => {
    expect(minutesToText(5)).toBe('5 min');
    expect(minutesToText(45)).toBe('45 min');
    expect(minutesToText(60)).toBe('1 hour');
    expect(minutesToText(90)).toBe('1 hour 30 min');
    expect(minutesToText(120)).toBe('2 hours');
  });
});

describe('format: measures', () => {
  it('us → metric with friendly rounding', () => {
    expect(toMetric({ qty: 1, unit: 'cup' })).toEqual({ qty: 240, unit: 'ml' });
    expect(toMetric({ qty: 1.5, unit: 'tsp' })).toEqual({ qty: 7, unit: 'ml' });
    expect(toMetric({ qty: 8, unit: 'oz' })).toEqual({ qty: 225, unit: 'g' });
    expect(toMetric({ qty: 1, unit: 'lb' })).toEqual({ qty: 455, unit: 'g' });
    expect(toMetric({ qty: 2, unit: 'tbsp' })).toEqual({ qty: 30, unit: 'ml' });
    expect(toMetric({ qty: 0.5, unit: 'cup' })).toEqual({ qty: 120, unit: 'ml' });
    expect(toMetric({ qty: 2, unit: 'piece' })).toEqual({ qty: 2, unit: 'piece' });
    expect(toMetric({ qty: 100, unit: 'g' })).toEqual({ qty: 100, unit: 'g' });
  });

  it('roundFriendly: whole numbers below 20 (half down), nearest 5 above', () => {
    expect(roundFriendly(7.5)).toBe(7);
    expect(roundFriendly(7.6)).toBe(8);
    expect(roundFriendly(0.4)).toBe(1);
    expect(roundFriendly(224)).toBe(225);
    expect(roundFriendly(454)).toBe(455);
    expect(roundFriendly(22)).toBe(20);
  });

  it('metric → us with kitchen fractions', () => {
    expect(toUs({ qty: 240, unit: 'ml' })).toEqual({ qty: 1, unit: 'cup' });
    expect(toUs({ qty: 120, unit: 'ml' })).toEqual({ qty: 0.5, unit: 'cup' });
    expect(toUs({ qty: 80, unit: 'ml' })).toEqual({ qty: 1 / 3, unit: 'cup' });
    expect(toUs({ qty: 30, unit: 'ml' })).toEqual({ qty: 2, unit: 'tbsp' });
    expect(toUs({ qty: 5, unit: 'ml' })).toEqual({ qty: 1, unit: 'tsp' });
    expect(toUs({ qty: 225, unit: 'g' })).toEqual({ qty: 8, unit: 'oz' });
    expect(toUs({ qty: 454, unit: 'g' })).toEqual({ qty: 1, unit: 'lb' });
    expect(toUs({ qty: 1, unit: 'pinch' })).toEqual({ qty: 1, unit: 'pinch' });
    expect(convertMeasure({ qty: 1, unit: 'cup' }, 'us')).toEqual({ qty: 1, unit: 'cup' });
  });

  it('fractionText and measure text', () => {
    expect(fractionText(0.5)).toBe('½');
    expect(fractionText(1.5)).toBe('1½');
    expect(fractionText(0.25)).toBe('¼');
    expect(fractionText(0.75)).toBe('¾');
    expect(fractionText(1 / 3)).toBe('⅓');
    expect(fractionText(2 / 3)).toBe('⅔');
    expect(fractionText(2)).toBe('2');
    expect(fractionText(2.3)).toBe('2.3');
    expect(formatMeasureText({ qty: 1.5, unit: 'cup' })).toBe('1½ cups');
    expect(formatMeasureText({ qty: 1, unit: 'cup' })).toBe('1 cup');
    expect(formatMeasureText({ qty: 240, unit: 'ml' })).toBe('240 ml');
    expect(formatMeasureText({ qty: 2, unit: 'piece' })).toBe('2');
    expect(formatMeasureText({ qty: 1, unit: 'pinch' })).toBe('1 pinch');
    expect(formatMeasureText({ qty: 2, unit: 'slice' })).toBe('2 slices');
  });

  it('formatMeasure derives the missing side of an ingredient', () => {
    const butter = { item: 'butter', us: { qty: 0.5, unit: 'cup' as const } };
    expect(formatMeasure(butter, 'us')).toBe('½ cup');
    expect(formatMeasure(butter, 'metric')).toBe('120 ml');
    const flour = { item: 'flour', metric: { qty: 225, unit: 'g' as const } };
    expect(formatMeasure(flour, 'metric')).toBe('225 g');
    expect(formatMeasure(flour, 'us')).toBe('8 oz');
    expect(formatMeasure({ item: 'a pinch of love' }, 'us')).toBe('');
  });
});
