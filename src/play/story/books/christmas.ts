/** Christmas — cameras frame the drawn village: snowman (x≈105), tree (800), sled (630), moon (1370), robin (1430). */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'christmas',
  title: '{name}’s Twinkly Christmas',
  cover: { x: 800, y: 560, zoom: 1.25 },
  pages: [
    {
      text: 'It is Christmas Eve, and the whole village is sparkling with snow. {name} counts the twinkly lights on the houses: one, two, three… two hundred and twelve!',
      camera: { x: 700, y: 560, zoom: 1.35 }, prop: '✨',
    },
    {
      text: '{name} and {friend} build a snowman with a stripy scarf and a carrot nose. It looks so smart that Dad lends it his best woolly hat.',
      solo: '{name} builds a snowman with a stripy scarf and a carrot nose. It looks so smart that Dad lends it his best woolly hat.',
      camera: { x: 130, y: 620, zoom: 2.2 }, prop: '⛄',
    },
    {
      text: 'In the square, the big tree wears a golden star on top. {name} hangs a paper snowflake on the lowest branch, right where everyone walking past can see it.',
      camera: { x: 800, y: 560, zoom: 1.7 }, prop: '🌟',
    },
    {
      text: 'Back home, it is time to put out a snack for Santa: three cookies, a glass of milk and a carrot for the reindeer. {name} takes one tiny nibble, just to check.',
      camera: { x: 1080, y: 650, zoom: 2.4 }, prop: '🍪',
    },
    {
      text: 'The stockings are hung, the lights are low, and {name} tries very hard to fall asleep. Outside, the moon keeps watch over the snowy roofs.',
      camera: { x: 1300, y: 400, zoom: 1.8 }, prop: '🧦',
    },
    {
      text: 'In the morning, the stockings are lumpy and bumpy and full! {name} and {friend} race outside in their pyjamas to try the brand-new sled.',
      solo: 'In the morning, the stockings are lumpy and bumpy and full! {name} races outside, still in pyjamas, to try the brand-new sled.',
      camera: { x: 630, y: 790, zoom: 2.4 }, prop: '🛷',
    },
    {
      text: '{name} sprinkles seeds in the snow for a little robin, who says thank you by puffing up like a ball. Christmas is extra cosy when you share it.',
      camera: { x: 1430, y: 770, zoom: 2.6 }, prop: '🐦',
    },
    {
      text: 'That night the whole family sings carols by the twinkly tree, and {name} sings loudest of all. Now it is only a year of sleeps until next Christmas!',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🎶',
    },
  ],
};
export default book;
