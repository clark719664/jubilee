/**
 * Where in the World? (activity id 'quiz') — a five-question globe quiz, skinned by the holiday it
 * opens from.
 *
 * Questions come from data (questions.ts): tap a country where the holiday is celebrated, spin to
 * where it began, find the country a fact is about; True-or-silly fact cards; "Which holiday says
 * Eid Mubarak?"; and time questions on the flat map ("Who says Happy New Year first?"). A right tap
 * lights the country in the holiday's accent with a sparkle; any other tap turns the globe to the
 * right place and lights it. No buzzer, no marks, no lives, no timer. Every globe question also has
 * "Choose from a list", so the quiz plays fully without pointing; on the globe, arrows turn it and
 * Enter picks the country under the crosshair. Reduced motion: no spins (the camera cuts), cards
 * cross-fade instead of flipping, sparkles hold still and fade.
 */
import './quiz.css';
import { CELEBRATED } from '../../world/data/celebrated';
import type { Activity } from '../types';
import { COPY } from './copy';
import { mountQuiz } from './view';

export { buildRound, EVERYTHING, placeQuestions, greetQuestions, factCandidates, newYearQuestion, nightQuestion, listChoices, isRight, answerLine } from './questions';
export type { Question, MapQuestion, FactQuestion, GreetQuestion, Choice, Pin } from './questions';
export { PLACES, countryLabel, countryPhrase } from './places';
export { silhouettePath } from './silhouette';

export const quizActivity: Activity = {
  id: 'quiz',
  title: COPY.title,
  emoji: COPY.emoji,
  blurb: COPY.blurb,
  // The World map knows where the holiday is celebrated (every registry holiday; not custom days).
  available: (meta) => CELEBRATED[meta.id] !== undefined,
  mount: (env) => mountQuiz(env),
};
