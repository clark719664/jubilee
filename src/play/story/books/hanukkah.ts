/** Hanukkah — each camera is the point of the drawn scene the page is about. */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'hanukkah',
  title: '{name} and the Eight Bright Nights',
  cover: { x: 800, y: 600, zoom: 1.3 },
  pages: [
    {
      text: 'It is the first night of Hanukkah, and the menorah stands ready in the window. {name} counts the places for candles: eight, plus one for the helper candle, the shamash.',
      camera: { x: 800, y: 620, zoom: 1.8 }, prop: '🕎',
    },
    {
      text: 'Dad lights the shamash, and the whole family sings the blessings. Then {name} uses the shamash to light the very first candle.',
      camera: { x: 800, y: 660, zoom: 2.6 }, prop: '🕯️',
    },
    {
      text: 'Grandma’s kitchen smells of crispy potato latkes sizzling in the pan. {name} is in charge of the apple sauce and taste-tests it six times.',
      camera: { x: 720, y: 660, zoom: 2.4 }, prop: '🥔',
    },
    {
      text: '{name} and {friend} spin the dreidel and read the letter it lands on: nun, gimel, hei or shin. Gimel means take the whole pile of chocolate gelt!',
      solo: '{name} spins the dreidel and reads the letter it lands on: nun, gimel, hei or shin. Gimel means take the whole pile of chocolate gelt!',
      camera: { x: 318, y: 720, zoom: 2.6 }, prop: '🪙',
    },
    {
      text: 'Grandpa tells the old story of a tiny jar of oil, enough for just one day, that kept the Temple lamp burning for eight whole days. That is why Hanukkah has eight nights.',
      camera: { x: 1420, y: 560, zoom: 1.8 }, prop: '🫙',
    },
    {
      text: 'Every night one more candle joins the others, and the window glows a little brighter. {name} says good night to each little flame.',
      camera: { x: 173, y: 556, zoom: 2.4 }, prop: '🌟',
    },
    {
      text: 'On the last night there are jelly doughnuts called sufganiyot. {name} gets powdered sugar all the way up to the eyebrows.',
      camera: { x: 1030, y: 770, zoom: 2.4 }, prop: '🍩',
    },
    {
      text: 'All nine flames shine in the window for the whole street to see. {name} says ‘Chag Sameach!’, which means ‘happy holiday’.',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🕎',
    },
  ],
};
export default book;
