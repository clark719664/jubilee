/** Thanksgiving — a family dinner and a thank-you circle; each camera is the point of the drawn scene the page is about. */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'thanksgiving',
  title: '{name}’s Thank-You Feast',
  cover: { x: 800, y: 580, zoom: 1.3 },
  pages: [
    {
      text: 'On Thanksgiving morning, the kitchen is the busiest room in the house. {name} is given the most important job of all: stirring.',
      camera: { x: 1260, y: 640, zoom: 2 }, prop: '🥄',
    },
    {
      text: 'Grandma rolls out the pie crust, and {name} presses a fork all around the edge. It looks like a sunshine made of pastry.',
      camera: { x: 1232, y: 730, zoom: 2.8 }, prop: '🥧',
    },
    {
      text: 'Cousins arrive, aunts arrive, and so does {friend}, carrying a bowl of cranberry sauce very, very carefully.',
      solo: 'Cousins arrive, aunts arrive, and Uncle Joe arrives carrying a bowl of cranberry sauce very, very carefully.',
      camera: { x: 1290, y: 700, zoom: 2.4 }, prop: '🏡',
    },
    {
      text: 'Before dinner, everyone traces a hand on paper and turns it into a turkey. Each finger-feather says one thing to be thankful for.',
      camera: { x: 330, y: 640, zoom: 2.2 }, prop: '🦃',
    },
    {
      text: 'Around the table, everyone takes a turn. {name} is thankful for family, for pie, and for the dog, who is thankful for dropped peas.',
      camera: { x: 800, y: 640, zoom: 2 }, prop: '🐕',
    },
    {
      text: 'There is turkey and stuffing, sweet potatoes and cornbread, and so many dishes that the salt has to sit on a chair.',
      camera: { x: 700, y: 680, zoom: 3 }, prop: '🌽',
    },
    {
      text: 'After dinner, the family packs a plate of food for a neighbor who lives alone. {name} carries the pie, the bravest job of all.',
      camera: { x: 1140, y: 700, zoom: 2.4 }, prop: '🍽️',
    },
    {
      text: 'When the stars come out, the whole house is cozy and full and a little bit sleepy. {name} says one last thank-you, for today.',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🍂',
    },
  ],
};
export default book;
