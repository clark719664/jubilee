/** Diwali — cameras frame the drawn street: sweet shop (x≈470), star lantern and door (800), clothes shop (1140), puppy (1266). */
import type { StoryBook } from '../types';

const book: StoryBook = {
  id: 'diwali',
  title: '{name} and the Row of Lamps',
  cover: { x: 800, y: 560, zoom: 1.25 },
  pages: [
    {
      text: 'It is Diwali, the festival of lights, and the whole street is getting ready. Nani says the first job is cleaning, so {name} sweeps until the doorstep shines.',
      camera: { x: 800, y: 720, zoom: 2.2 }, prop: '🧹',
    },
    {
      text: 'At the sweet shop, the trays are piled high with ladoo, barfi and sticky orange jalebi. {name} and {friend} may choose one each, which takes a very long time.',
      solo: 'At the sweet shop, the trays are piled high with ladoo, barfi and sticky orange jalebi. {name} may choose just one, which takes a very long time.',
      camera: { x: 470, y: 700, zoom: 2.4 }, prop: '🍬',
    },
    {
      text: 'Next come new clothes for Diwali! {name} twirls in an outfit the colour of marigolds, so fast that the parrot on the roof flaps its wings.',
      camera: { x: 1150, y: 640, zoom: 2.4 }, prop: '🦜',
    },
    {
      text: 'On the doorstep, {name} helps Mum make a rangoli, a big flower pattern of coloured powder. The cat watches closely, but promises not to walk on it.',
      camera: { x: 800, y: 760, zoom: 2.6 }, prop: '🌸',
    },
    {
      text: 'As the sky grows dark, the family lights little clay lamps called diyas. They glow on the windowsills, along the steps and all the way across the roof.',
      camera: { x: 800, y: 520, zoom: 1.5 }, prop: '🪔',
    },
    {
      text: 'Then the family gathers for puja, a prayer for a bright and happy year. {name} gets to ring the little brass bell, gently, while everyone sings.',
      camera: { x: 800, y: 560, zoom: 2.4 }, prop: '🔔',
    },
    {
      text: 'Neighbours come by with boxes of sweets, and soon the sky crackles with fireworks. {friend} and {name} cover their ears and giggle.',
      solo: 'Neighbours come by with boxes of sweets, and soon the sky crackles with fireworks. The sleepy puppy hides its nose under its paws.',
      camera: { x: 1266, y: 780, zoom: 2.6 }, prop: '🎆',
    },
    {
      text: 'When the last diya flickers, {name} whispers ‘Happy Diwali’ to the sleepy street. Tonight, the light has won against the dark.',
      camera: { x: 800, y: 560, zoom: 1.15 }, prop: '✨',
    },
  ],
};
export default book;
