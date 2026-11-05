/** Kwanzaa — seven candles, seven principles, the Karamu feast; cameras follow the scene contract until the art lands. */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'kwanzaa',
  title: '{name}’s Seven Candles',
  cover: { x: 800, y: 540, zoom: 1.25 },
  pages: [
    {
      text: 'It is the first night of Kwanzaa, and the kinara stands on the table with seven candles: three red, one black and three green.',
      camera: { x: 800, y: 640, zoom: 2 }, prop: '🕯️',
    },
    {
      text: '{name} lights the black candle in the middle. It stands for Umoja, unity, which means sticking together like a family.',
      camera: { x: 800, y: 700, zoom: 2.6 }, prop: '🤝',
    },
    {
      text: 'When Grandpa asks, ‘Habari gani?’, which means ‘What’s the news?’, {name} shouts the answer: ‘Umoja!’',
      camera: { x: 480, y: 640, zoom: 2 }, prop: '🥁',
    },
    {
      text: 'Each night one more candle is lit, and the family talks about a new big idea, like working together, sharing and having faith.',
      camera: { x: 800, y: 560, zoom: 1.6 }, prop: '💡',
    },
    {
      text: 'On the night of Kuumba, creativity, {name} and {friend} make a paper chain in red, black and green that reaches the ceiling.',
      solo: 'On the night of Kuumba, creativity, {name} makes a paper chain in red, black and green that reaches the ceiling.',
      camera: { x: 1120, y: 640, zoom: 2 }, prop: '🎨',
    },
    {
      text: 'Then comes the Karamu, a big feast with family and friends. There is music, drumming and Auntie’s famous sweet potato pie.',
      camera: { x: 640, y: 540, zoom: 1.25 }, prop: '🥧',
    },
    {
      text: 'Everyone sips from the unity cup to remember the grandparents and great-grandparents who came before.',
      camera: { x: 1000, y: 700, zoom: 2.4 }, prop: '🍵',
    },
    {
      text: 'On the last day, {name} gives Grandma a handmade gift: a drawing of the whole family holding hands. All seven candles shine, and so does Grandma.',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🎁',
    },
  ],
};
export default book;
