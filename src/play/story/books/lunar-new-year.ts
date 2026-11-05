/** Lunar New Year — each camera is the point of the drawn scene the page is about. */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'lunar-new-year',
  title: '{name} Sweeps In the New Year',
  cover: { x: 800, y: 560, zoom: 1.25 },
  pages: [
    {
      text: 'Lunar New Year, also called Chinese New Year, Tết or Seollal, is coming, and the whole house gets cleaned. {name} sweeps out the old year, and quite a lot of old crumbs.',
      camera: { x: 400, y: 640, zoom: 1.8 }, prop: '🧹',
    },
    {
      text: 'Next come the decorations: red paper cuts on the windows and red lanterns by the door. Red is the color of good luck.',
      camera: { x: 1230, y: 640, zoom: 2.2 }, prop: '🏮',
    },
    {
      text: 'On New Year’s Eve, the whole family squeezes round Grandma’s table for the big reunion dinner. {name} counts eleven dishes and two cousins under the table.',
      camera: { x: 440, y: 700, zoom: 2.2 }, prop: '🥢',
    },
    {
      text: '{name} and {friend} help fold the dumplings. Some look like little purses, and some look like very confused mice.',
      solo: '{name} helps fold the dumplings. Some look like little purses, and some look like very confused mice.',
      camera: { x: 460, y: 720, zoom: 2.8 }, prop: '🥟',
    },
    {
      text: 'There is a whole fish too, because in Chinese the word for fish sounds like the word for plenty. Here’s to plenty all year long!',
      camera: { x: 1000, y: 640, zoom: 2 }, prop: '🐟',
    },
    {
      text: 'At midnight the street pops and crackles with firecrackers, and {name} stays awake for all of it. Well, almost all of it.',
      camera: { x: 596, y: 640, zoom: 2.4 }, prop: '🧨',
    },
    {
      text: 'In the morning, {name} wishes Grandpa a happy new year and gets a red envelope with lucky money inside.',
      camera: { x: 196, y: 618, zoom: 2.4 }, prop: '🧧',
    },
    {
      text: 'Then, boom, boom, boom: drums! A lion dance comes prancing down the street, and the lion winks right at {name}.',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🦁',
    },
  ],
};
export default book;
