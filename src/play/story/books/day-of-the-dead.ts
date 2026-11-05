/** Day of the Dead — remembering with love: an ofrenda, marigolds, family stories; warm, never spooky. */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'day-of-the-dead',
  title: '{name} and the Marigold Path',
  cover: { x: 800, y: 560, zoom: 1.25 },
  pages: [
    {
      text: 'Día de Muertos, Mexico’s Day of the Dead, is coming, and {name}’s family is building an ofrenda. It is a special table for remembering the people we love who have died.',
      camera: { x: 800, y: 580, zoom: 1.8 }, prop: '🕯️',
    },
    {
      text: 'In the middle goes a photo of Bisabuela, {name}’s great-grandmother. She danced at every party and always smelled of cinnamon.',
      camera: { x: 800, y: 560, zoom: 2.8 }, prop: '🖼️',
    },
    {
      text: '{name} and {friend} scatter orange marigold petals in a path to the ofrenda. A tradition says their bright colour helps loved ones find their way home.',
      solo: '{name} scatters orange marigold petals in a path to the ofrenda. A tradition says their bright colour helps loved ones find their way home.',
      camera: { x: 800, y: 800, zoom: 2.4 }, prop: '🏵️',
    },
    {
      text: 'On the ofrenda go candles, paper banners with cut-out patterns, and a sugar skull with a big icing smile.',
      camera: { x: 800, y: 660, zoom: 2.6 }, prop: '🍬',
    },
    {
      text: 'There is pan de muerto, a soft sweet bread, and a cup of hot chocolate, because Bisabuela loved chocolate more than anything.',
      camera: { x: 880, y: 650, zoom: 2.8 }, prop: '🍞',
    },
    {
      text: 'At the cemetery, the family sweeps away the leaves and covers the grave in flowers. It looks like a garden party.',
      camera: { x: 1450, y: 780, zoom: 2.2 }, prop: '💐',
    },
    {
      text: 'Then the stories begin. Abuelo tells how Bisabuela once danced so hard she lost a shoe, and {name} laughs until the hiccups come.',
      camera: { x: 262, y: 680, zoom: 2.4 }, prop: '💃',
    },
    {
      text: 'The candles glow, the music plays, and {name} feels Bisabuela close, like a warm hug. When we remember, love stays.',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🧡',
    },
  ],
};
export default book;
