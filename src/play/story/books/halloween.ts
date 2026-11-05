/** Halloween — the friendly kind of spooky: bedsheet ghosts, paper skeletons, thank-yous at every door. */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'halloween',
  title: '{name} and the Not-Very-Spooky Night',
  cover: { x: 800, y: 560, zoom: 1.25 },
  pages: [
    {
      text: 'It is Halloween, and the pumpkins on the steps are waiting for faces. {name} draws a goofy grin, and a grown-up does the careful cutting.',
      camera: { x: 760, y: 790, zoom: 2.6 }, prop: '🎃',
    },
    {
      text: 'With a little light inside, the jack-o’-lantern glows as if it is trying not to giggle. {name} names it Sir Pumpkinhead.',
      camera: { x: 868, y: 780, zoom: 3 }, prop: '💡',
    },
    {
      text: '{name} dresses up as a friendly ghost, and {friend} is a dinosaur with a very long tail. They practise their best spooky ‘boo’ in the mirror.',
      solo: '{name} dresses up as a friendly ghost, with two holes to see out of. Practising a spooky ‘boo’ in the mirror only makes the ghost laugh.',
      camera: { x: 435, y: 600, zoom: 2.4 }, prop: '👻',
    },
    {
      text: 'Every porch light is a little lighthouse that says, ‘Come and say hello.’ With Mum close behind, {name} knocks: trick or treat!',
      camera: { x: 800, y: 680, zoom: 2 }, prop: '🚪',
    },
    {
      text: 'One neighbour has a paper skeleton that dances whenever the wind blows. {name} dances right back.',
      camera: { x: 1420, y: 600, zoom: 2.2 }, prop: '💀',
    },
    {
      text: 'Mum carries the torch, the treat bucket gets heavier and heavier, and {name} says thank you at every single door.',
      camera: { x: 340, y: 840, zoom: 2.6 }, prop: '🍬',
    },
    {
      text: 'Back home, {name} sorts the sweets into piles: chocolate, chewy, and ones to swap with Dad.',
      camera: { x: 1100, y: 620, zoom: 2.2 }, prop: '🍫',
    },
    {
      text: 'The costume goes in the wash, the pumpkin keeps glowing, and {name} falls fast asleep. Happy Halloween, Sir Pumpkinhead!',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '🌙',
    },
  ],
};
export default book;
