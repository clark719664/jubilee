/** Nowruz — spring cleaning, the sabzeh, the Haft-Seen table and the Sizdah Bedar picnic. */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'nowruz',
  title: '{name} and the First Day of Spring',
  cover: { x: 800, y: 560, zoom: 1.25 },
  pages: [
    {
      text: 'Nowruz means ‘new day’, and it begins at the very moment spring arrives. To get ready, the family cleans the whole house, even under the sofa.',
      camera: { x: 560, y: 600, zoom: 2 }, prop: '🧽',
    },
    {
      text: 'Two weeks ago, {name} planted lentils in a dish. Now they have grown into sabzeh, a little green lawn for the new year.',
      camera: { x: 760, y: 640, zoom: 2.8 }, prop: '🌱',
    },
    {
      text: '{name} and {friend} help set the Haft-Seen table with seven things whose Persian names begin with S, like apples, garlic and sprouts.',
      solo: '{name} helps set the Haft-Seen table with seven things whose Persian names begin with S, like apples, garlic and sprouts.',
      camera: { x: 800, y: 640, zoom: 2.2 }, prop: '🍎',
    },
    {
      text: 'There is also a mirror, painted eggs and a goldfish in a bowl, who looks very proud to be on the table.',
      camera: { x: 800, y: 760, zoom: 2.6 }, prop: '🐟',
    },
    {
      text: 'When the new year arrives, the family hugs and says ‘Nowruz Mobarak!’ Grandpa gives {name} a crisp new banknote tucked inside a book.',
      camera: { x: 720, y: 620, zoom: 2 }, prop: '📖',
    },
    {
      text: 'For days and days the family visits relatives, starting with the oldest. Every house has sweets, and {name} politely tries them all.',
      camera: { x: 1000, y: 620, zoom: 2.2 }, prop: '🍬',
    },
    {
      text: 'On the thirteenth day, called Sizdah Bedar, everyone heads outside for a big picnic in the park.',
      camera: { x: 1240, y: 720, zoom: 2.4 }, prop: '🧺',
    },
    {
      text: '{name} ties a knot in the sabzeh grass, makes a wish and lets it float away down the stream. Hello spring, hello sunshine!',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🌸',
    },
  ],
};
export default book;
