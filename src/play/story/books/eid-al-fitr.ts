/**
 * Eid al-Fitr — a family story; the prayer is shown from the outside (the mosque), never words put in anyone’s mouth.
 * Cameras frame the drawn street: cat on the roof (x≈150), sweets stall (440), Auntie in the doorway (800), boy in
 * new clothes (890), green-domed mosque (1430), coffee pot and dates (1460). The crescent (1060, 250) is the book’s
 * own moon: out of view on p1 (the family is still looking for it), in view on p2 and on the good-night page.
 */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'eid-al-fitr',
  title: '{name}’s Sweet Eid',
  cover: { x: 800, y: 560, zoom: 1.25 },
  moon: { x: 1060, y: 250, r: 44, kind: 'crescent' },
  pages: [
    {
      text: 'On the last evening of Ramadan, {name} and Baba look up at the sky for the new moon. Everybody is squinting, even the cat on the roof.',
      camera: { x: 190, y: 380, zoom: 2.2 }, prop: '🔭',
    },
    {
      text: 'There it is: a silver crescent as thin as a fingernail! Tomorrow is Eid, and the whole family cheers.',
      camera: { x: 1150, y: 330, zoom: 1.6 }, prop: '🌙',
    },
    {
      text: 'In the morning, {name} puts on brand-new clothes and a dab of Mama’s rose perfume. Before the Eid prayer, the family gives food to people who need it.',
      camera: { x: 890, y: 730, zoom: 2.6 }, prop: '🌹',
    },
    {
      text: 'The whole family walks to the mosque with the green dome for the big Eid prayer. Afterwards there are hugs, handshakes and ‘Eid Mubarak!’ all around.',
      camera: { x: 1430, y: 540, zoom: 1.8 }, prop: '🤝',
    },
    {
      text: 'Then the visiting begins! At Auntie’s house, {name} and {friend} eat date cookies, sweet vermicelli and one more cookie, just to be polite.',
      solo: 'Then the visiting begins! At Auntie’s house, {name} eats date cookies, sweet vermicelli and one more cookie, just to be polite.',
      camera: { x: 440, y: 720, zoom: 2.2 }, prop: '🍪',
    },
    {
      text: 'The grown-ups hand out Eidi, a little gift of money in a shiny envelope. {name} counts it twice and decides to save half.',
      camera: { x: 800, y: 690, zoom: 2.4 }, prop: '💌',
    },
    {
      text: 'Over little cups of coffee and dates, Grandpa tells how hard it was to fast when he was little. {name} tells how hard it was to wait for Eid.',
      camera: { x: 1460, y: 800, zoom: 2.4 }, prop: '☕',
    },
    {
      text: 'By bedtime, {name} is full of sweets and hugs. Good night, little moon, and Eid Mubarak!',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '⭐',
    },
  ],
};
export default book;
