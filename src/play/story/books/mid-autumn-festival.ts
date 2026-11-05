/**
 * Mid-Autumn Festival — lanterns, mooncakes, a pomelo-peel hat and the rabbit in the moon. Cameras frame the drawn
 * lakeside: white rabbit on the rock (x≈330), Grandma and the mooncakes (600), the boy waving up at the sky (810),
 * rabbit lantern (950), boats and lotus lanterns (1300); the full moon (1010, 230), with the Jade Rabbit and its
 * mortar, is the book’s own moon and is in view on every page that talks about it (p1, p5–p8).
 */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'mid-autumn-festival',
  title: '{name} and the Round, Bright Moon',
  cover: { x: 800, y: 560, zoom: 1.25 },
  moon: { x: 1010, y: 230, r: 92, kind: 'full', rabbit: true },
  pages: [
    {
      text: 'Tonight is the Mid-Autumn Festival, when people say the moon is at its roundest and brightest. Some families call it the Moon Festival or Tết Trung Thu.',
      camera: { x: 900, y: 380, zoom: 1.4 }, prop: '🌕',
    },
    {
      text: '{name} carries a glowing rabbit lantern, and {friend} has one shaped like a fish. They swing them gently so the light wobbles on the path.',
      solo: '{name} carries a glowing rabbit lantern and swings it gently, so the light wobbles on the path.',
      camera: { x: 862, y: 780, zoom: 2.6 }, prop: '🏮',
    },
    {
      text: 'Grandma cuts a mooncake into slices to share. Inside there is sweet lotus paste and a golden yolk, like a little moon inside a moon.',
      camera: { x: 650, y: 740, zoom: 2.8 }, prop: '🥮',
    },
    {
      text: 'Grandpa peels a giant pomelo, and {name} wears the peel as a hat. Everyone agrees it is a very fine hat.',
      camera: { x: 700, y: 720, zoom: 2.2 }, prop: '🍈',
    },
    {
      text: 'Then the whole family looks up. Grandma says that if you look very closely, you might see a rabbit on the moon.',
      camera: { x: 800, y: 470, zoom: 1.3 }, prop: '🐇',
    },
    {
      text: '{name} squints and squints. Yes, there is the rabbit, pounding medicine in a little bowl!',
      camera: { x: 1010, y: 240, zoom: 2.6 }, prop: '🌕',
    },
    {
      text: 'Far away, the cousins are looking up at the very same moon. {name} waves at it, so the moon can pass the wave along.',
      camera: { x: 1200, y: 450, zoom: 1.5 }, prop: '👋',
    },
    {
      text: 'At bedtime the lantern glows by the window, and the moon peeks in to say good night to {name}.',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🌙',
    },
  ],
};
export default book;
