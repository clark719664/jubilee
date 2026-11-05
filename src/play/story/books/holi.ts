/** Holi — the bonfire night, then the colour morning; each camera is the point of the drawn scene the page is about. */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'holi',
  title: '{name} and the Rainbow Morning',
  cover: { x: 800, y: 600, zoom: 1.25 },
  pages: [
    {
      text: 'On the night before Holi, the neighbours gather round a big bonfire. {name} watches the sparks fly up like tiny orange stars.',
      camera: { x: 800, y: 560, zoom: 1.3 }, prop: '🔥',
    },
    {
      text: 'In the morning, {name} puts on the oldest, whitest T-shirt in the house. By lunchtime it will not be white at all.',
      camera: { x: 420, y: 620, zoom: 2.4 }, prop: '👕',
    },
    {
      text: 'Outside, the whole street is waiting with bowls of coloured powder called gulal: pink, green, yellow and the brightest blue.',
      camera: { x: 760, y: 770, zoom: 2.4 }, prop: '🎨',
    },
    {
      text: '{friend} sneaks up, pats pink powder on {name}’s cheeks and laughs, ‘Bura na mano, Holi hai!’ That means ‘Don’t be upset, it’s Holi!’',
      solo: 'Dadi sneaks up, pats pink powder on {name}’s cheeks and laughs, ‘Bura na mano, Holi hai!’ That means ‘Don’t be upset, it’s Holi!’',
      camera: { x: 820, y: 760, zoom: 2.8 }, prop: '💗',
    },
    {
      text: '{name} fills a water squirter and gets Dad right in the back. Dad was not expecting that.',
      camera: { x: 450, y: 780, zoom: 2.6 }, prop: '💦',
    },
    {
      text: 'Drums thump, everyone dances, and soon nobody can tell who is who. Is that a cousin, or a walking rainbow?',
      camera: { x: 1288, y: 790, zoom: 2.6 }, prop: '🥁',
    },
    {
      text: 'After a big wash, there are gujiya, crunchy little pastries with a sweet filling. {name}, whose ears are somehow still pink, eats three.',
      camera: { x: 1090, y: 742, zoom: 2.6 }, prop: '🥟',
    },
    {
      text: 'Holi says hello to spring and goodbye to grumpiness. {name} goes to bed clean, happy and still a tiny bit green.',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🌈',
    },
  ],
};
export default book;
